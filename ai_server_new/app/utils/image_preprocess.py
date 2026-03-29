# app/utils/image_preprocess.py

from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

def decode_base64_image(image_base64: str) -> Image.Image:
  image_bytes = base64.b64decode(image_base64)
  image = Image.open(io.BytesIO(image_bytes))
  image = ImageOps.exif_transpose(image)
  return image.convert("RGB")

def encode_image_to_base64(
  image: Image.Image,
  format: str = "JPEG",
  quality: int = 90,
) -> str:
  buffer = io.BytesIO()
  image.save(buffer, format=format, quality=quality)
  return base64.b64encode(buffer.getvalue()).decode("utf-8")

def resize_image(
  image: Image.Image,
  max_width: int = 1280,
  max_height: int = 1280,
) -> Image.Image:
  copied = image.copy()
  copied.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
  return copied

def adjust_brightness_contrast(
  image: Image.Image,
  brightness: float = 1.05,
  contrast: float = 1.1,
) -> Image.Image:
  copied = image.copy()
  copied = ImageEnhance.Brightness(copied).enhance(brightness)
  copied = ImageEnhance.Contrast(copied).enhance(contrast)
  return copied

def pil_to_cv2(image: Image.Image) -> np.ndarray:
  rgb = np.array(image)
  return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

def cv2_to_pil(image: np.ndarray) -> Image.Image:
  rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
  return Image.fromarray(rgb)

def denoise_image_opencv(image: Image.Image) -> Image.Image:
  cv_img = pil_to_cv2(image)
  denoised = cv2.fastNlMeansDenoisingColored(cv_img, None, 5, 5, 7, 21)
  return cv2_to_pil(denoised)

def auto_contrast_opencv(image: Image.Image) -> Image.Image:
  cv_img = pil_to_cv2(image)
  lab = cv2.cvtColor(cv_img, cv2.COLOR_BGR2LAB)
  l, a, b = cv2.split(lab)
  
  clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
  l2 = clahe.apply(l)
  
  merged = cv2.merge((l2, a, b))
  result = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
  return cv2_to_pil(result)

def sharpen_image_opencv(image: Image.Image) -> Image.Image:
  cv_img = pil_to_cv2(image)
  
  kernel = np.array([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ])
  
  sharpened = cv2.filter2D(cv_img, -1, kernel)
  return cv2_to_pil(sharpened)

def preprocess_image_for_vision(
  image_base64: str,
  max_width: int = 1280,
  max_height: int = 1280,
  brightness: float = 1.05,
  contrast: float = 1.1,
  output_format: str = "JPEG",
  quality: int = 90,
) -> str:
  image = decode_base64_image(image_base64)
  
  # Pillow
  image = resize_image(image, max_width=max_width, max_height=max_height)
  image = adjust_brightness_contrast(
    image,
    brightness=brightness,
    contrast=contrast,
  )
  
  # OpenCV
  image = denoise_image_opencv(image)
  image = auto_contrast_opencv(image)
  image = sharpen_image_opencv(image)
  
  return encode_image_to_base64(
    image,
    format=output_format,
    quality=quality,
  )