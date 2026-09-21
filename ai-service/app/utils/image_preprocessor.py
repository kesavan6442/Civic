import io
import os
import base64
import numpy as np
from PIL import Image, ImageStat
from typing import Optional, Tuple, Dict, Any
import requests

def load_image_from_source(image_url: Optional[str] = None, image_base64: Optional[str] = None) -> Optional[Image.Image]:
    try:
        raw_img = None
        if image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            data = base64.b64decode(image_base64)
            raw_img = Image.open(io.BytesIO(data))
        elif image_url:
            if image_url.startswith("data:image"):
                data = image_url.split(",", 1)[1] if "," in image_url else image_url
                raw_img = Image.open(io.BytesIO(base64.b64decode(data)))
            elif image_url.startswith("http://") or image_url.startswith("https://"):
                res = requests.get(image_url, timeout=5)
                if res.status_code == 200:
                    raw_img = Image.open(io.BytesIO(res.content))
            elif image_url.startswith("/api/files/"):
                # Try local uploads directory first
                filename = image_url.replace("/api/files/", "")
                candidates = [
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "server-spring", "uploads", "evidence", filename),
                    os.path.join("server-spring", "uploads", "evidence", filename),
                    os.path.join("uploads", "evidence", filename)
                ]
                for c in candidates:
                    if os.path.exists(c):
                        raw_img = Image.open(c)
                        break
                # Fallback to fetching from Spring Boot
                if raw_img is None:
                    try:
                        res = requests.get(f"http://localhost:5000{image_url}", timeout=5)
                        if res.status_code == 200:
                            raw_img = Image.open(io.BytesIO(res.content))
                    except Exception:
                        pass
            elif os.path.exists(image_url):
                raw_img = Image.open(image_url)
        
        if raw_img is not None:
            info = getattr(raw_img, 'info', {}) or {}
            rgb_img = raw_img.convert("RGB")
            rgb_img.info = info
            return rgb_img
    except Exception as e:
        print(f"Error loading image: {e}")
    return None

def compute_frequency_domain_features(img: Image.Image) -> Dict[str, float]:
    """
    Analyzes 2D Fast Fourier Transform (FFT) power spectrum for synthetic upsampling
    or high-frequency artifact suppression common in Diffusion/GAN architectures.
    """
    try:
        gray = img.convert("L").resize((256, 256))
        arr = np.array(gray, dtype=np.float32)
        f = np.fft.fft2(arr)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-8)
        
        # Calculate energy distribution between high and mid frequencies
        h, w = magnitude_spectrum.shape
        center_h, center_w = h // 2, w // 2
        
        # High frequency outer perimeter
        outer_mask = np.ones((h, w), bool)
        outer_mask[center_h - 40:center_h + 40, center_w - 40:center_w + 40] = False
        high_freq_energy = float(np.mean(magnitude_spectrum[outer_mask]))
        mid_freq_energy = float(np.mean(magnitude_spectrum[~outer_mask]))
        
        ratio = high_freq_energy / (mid_freq_energy + 1e-6)
        
        # Color distribution sharpness
        stat = ImageStat.Stat(img)
        var = stat.var
        avg_var = float(np.mean(var))
        
        return {
            "high_freq_energy": round(high_freq_energy, 4),
            "mid_freq_energy": round(mid_freq_energy, 4),
            "freq_ratio": round(ratio, 4),
            "color_variance": round(avg_var, 4)
        }
    except Exception as e:
        return {"high_freq_energy": 0.0, "mid_freq_energy": 0.0, "freq_ratio": 0.0, "color_variance": 0.0}
