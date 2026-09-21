package gov.jharkhand.civicconnect.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger log = LoggerFactory.getLogger(FileUploadService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    @Value("${upload.directory:uploads/evidence}")
    private String uploadDirectory;

    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList(
            "exe", "bat", "cmd", "sh", "bin", "php", "jsp", "asp", "aspx",
            "js", "vbs", "py", "pl", "cgi", "html", "htm", "jar", "war", "dll"
    );

    public static class UploadResult {
        private final String originalFilename;
        private final String safeFilename;
        private final String fileUrl;
        private final String mimeType;
        private final long size;

        public UploadResult(String originalFilename, String safeFilename, String fileUrl, String mimeType, long size) {
            this.originalFilename = originalFilename;
            this.safeFilename = safeFilename;
            this.fileUrl = fileUrl;
            this.mimeType = mimeType;
            this.size = size;
        }

        public String getOriginalFilename() { return originalFilename; }
        public String getSafeFilename() { return safeFilename; }
        public String getFileUrl() { return fileUrl; }
        public String getMimeType() { return mimeType; }
        public long getSize() { return size; }
    }

    public UploadResult storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum permitted limit of 10MB");
        }

        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.trim().isEmpty()) {
            rawFilename = "upload_" + System.currentTimeMillis();
        }

        // 1. Check for path traversal attempts
        if (rawFilename.contains("..") || rawFilename.contains("/") || rawFilename.contains("\\")) {
            log.warn("Path traversal detected in upload filename: {}", rawFilename);
            throw new IllegalArgumentException("Invalid filename structure");
        }

        // 2. Validate file extension
        String extension = getFileExtension(rawFilename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            log.warn("Blocked dangerous file extension upload attempt: {}", extension);
            throw new IllegalArgumentException("Executable and script files are strictly prohibited");
        }

        // 3. Validate Magic Bytes (Actual Binary Header)
        String detectedMime = detectMimeTypeByMagicBytes(file);
        if (detectedMime == null) {
            log.warn("Uploaded file header failed magic-byte validation: {}", rawFilename);
            throw new IllegalArgumentException("Invalid file format. Only JPEG, PNG, WEBP, and PDF files are allowed.");
        }

        // 4. Generate Safe Server-Side Unique Filename
        String safeExtension = getSafeExtensionForMime(detectedMime, extension);
        String safeFilename = UUID.randomUUID().toString() + safeExtension;

        // 5. Store File
        Path uploadPath = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path targetLocation = uploadPath.resolve(safeFilename).normalize();
        if (!targetLocation.startsWith(uploadPath)) {
            throw new SecurityException("Target path lies outside configured upload directory");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        }

        String fileUrl = "/api/files/" + safeFilename;
        return new UploadResult(rawFilename, safeFilename, fileUrl, detectedMime, file.getSize());
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex > 0 && lastIndex < filename.length() - 1) {
            return filename.substring(lastIndex + 1);
        }
        return "";
    }

    private String getSafeExtensionForMime(String mimeType, String originalExt) {
        switch (mimeType) {
            case "image/jpeg": return ".jpg";
            case "image/png": return ".png";
            case "image/webp": return ".webp";
            case "application/pdf": return ".pdf";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return ".docx";
            default: return originalExt.isEmpty() ? ".bin" : "." + originalExt;
        }
    }

    public String detectMimeTypeByMagicBytes(MultipartFile file) throws IOException {
        byte[] header = new byte[12];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header, 0, header.length);
            if (read < 4) {
                return null;
            }
        }

        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 &&
            (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47) {
            return "image/png";
        }
        // GIF: 47 49 46 38
        if (header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8') {
            return "image/gif";
        }
        // PDF: 25 50 44 46 (%PDF)
        if (header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F') {
            return "application/pdf";
        }
        // DOCX / Office Open XML (PK\x03\x04)
        if ((header[0] & 0xFF) == 0x50 && (header[1] & 0xFF) == 0x4B &&
            (header[2] & 0xFF) == 0x03 && (header[3] & 0xFF) == 0x04) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        // WEBP: RIFF....WEBP
        if (header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
            header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return "image/webp";
        }

        return null;
    }
}
