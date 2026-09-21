import numpy as np
from PIL import Image
from typing import Dict, Any, Optional
from app.utils.image_preprocessor import load_image_from_source, compute_frequency_domain_features
from app.schemas.image_schemas import AuthenticityStatus, ImageAuthenticityResult

class ImageAuthenticityDetector:
    def __init__(self):
        self.model_name = "CivicForensics-MultiSignal-v2.1"
        self.model_version = "2.1.0"
        self.high_confidence_ai_threshold = 0.88
        self.uncertain_low_threshold = 0.60

    def analyze_image_authenticity(
        self,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None
    ) -> ImageAuthenticityResult:
        img = load_image_from_source(image_url, image_base64)
        if img is None:
            return ImageAuthenticityResult(
                status=AuthenticityStatus.UNCERTAIN,
                confidence=0.50,
                model_name=self.model_name,
                model_version=self.model_version,
                is_acceptable_evidence=False,
                rejection_reason="Unable to load image for forensic analysis.",
                forensic_signals={}
            )

        # 1. Inspect image metadata for known synthetic generation signatures
        img_info = getattr(img, "info", {}) or {}
        info_str = " ".join([f"{k}:{v}" for k, v in img_info.items()]).lower()
        ai_keywords = [
            "midjourney", "stable diffusion", "stablediffusion", "dall-e", "dalle",
            "comfyui", "novelai", "flux", "imagen", "civitai", "automatic1111", "prompt"
        ]
        has_ai_metadata = any(kw in info_str for kw in ai_keywords)

        # 2. Frequency Domain Spectral Features
        freq_features = compute_frequency_domain_features(img)
        ratio = freq_features.get("freq_ratio", 1.0)
        color_var = freq_features.get("color_variance", 500.0)

        # 3. Forensic Scoring based on diffusion/GAN signatures & metadata
        if has_ai_metadata:
            synthetic_risk_score = 0.98
        else:
            synthetic_risk_score = 0.15

            # Check for abnormal frequency energy ratio
            if ratio < 0.25:
                synthetic_risk_score += 0.40 # Overly smoothed synthetic frequency profile
            elif ratio > 1.85:
                synthetic_risk_score += 0.35 # High-frequency checkerboard / uncalibrated diffusion artifact

            # Check for unnaturally uniform color variance in photo
            if color_var < 80.0:
                synthetic_risk_score += 0.30
            elif color_var > 6500.0:
                synthetic_risk_score += 0.15 # Extreme hyper-saturation common in generated art

        synthetic_risk_score = min(0.99, max(0.05, synthetic_risk_score))

        # 3. Decision Boundary
        if synthetic_risk_score >= self.high_confidence_ai_threshold:
            status = AuthenticityStatus.AI_GENERATED
            confidence = round(synthetic_risk_score, 2)
            is_acceptable = False
            rejection_reason = "AI-generated or synthetic image detected with high confidence. Please upload an original photograph captured on-site."
        elif synthetic_risk_score >= self.uncertain_low_threshold:
            status = AuthenticityStatus.UNCERTAIN
            confidence = round(synthetic_risk_score, 2)
            is_acceptable = False
            rejection_reason = "Authenticity review required: Image displays compression or synthetic visual anomalies. Forwarded to Admin for manual verification."
        else:
            status = AuthenticityStatus.REAL
            confidence = round(1.0 - synthetic_risk_score, 2)
            is_acceptable = True
            rejection_reason = None

        return ImageAuthenticityResult(
            status=status,
            confidence=confidence,
            model_name=self.model_name,
            model_version=self.model_version,
            is_acceptable_evidence=is_acceptable,
            rejection_reason=rejection_reason,
            forensic_signals=freq_features
        )

authenticity_detector = ImageAuthenticityDetector()
