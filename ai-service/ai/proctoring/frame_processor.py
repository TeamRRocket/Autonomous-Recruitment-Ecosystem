"""
Frame Processor - YOLOv8-based visual detection (Hugging Face / Ultralytics)
Detects faces, head pose, phones, and potential cheating indicators
"""
import cv2
import numpy as np
import base64
from datetime import datetime
from typing import Dict, Tuple, List

# Try to load YOLOv8, fallback to OpenCV if unavailable
YOLO_AVAILABLE = False
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    print("✓ YOLOv8 (ultralytics) available")
except ImportError:
    print("⚠ ultralytics not installed, falling back to OpenCV Haar Cascade")


class YOLOFrameProcessor:
    """YOLOv8-based frame analysis for proctoring"""
    
    # COCO class IDs we care about
    PERSON_CLASS = 0       # person
    CELL_PHONE_CLASS = 67  # cell phone
    BOOK_CLASS = 73        # book
    LAPTOP_CLASS = 63      # laptop
    
    def __init__(self):
        """Initialize YOLOv8 model"""
        self.model = None
        self.face_model = None
        
        try:
            # Load YOLOv8n (nano) for object detection - fast and lightweight
            # Downloads automatically from Hugging Face / Ultralytics on first run
            self.model = YOLO('yolov8n.pt')
            print("✓ YOLOv8n object detection model loaded")
            
            # Load YOLOv8n-face for face detection (specialized face model)
            # This provides better face detection than general object detection
            try:
                self.face_model = YOLO('yolov8n-face.pt')
                print("✓ YOLOv8n-face model loaded")
            except Exception:
                print("⚠ YOLOv8n-face not available, using general model for face detection")
                self.face_model = None
                
        except Exception as e:
            print(f"⚠ Failed to load YOLOv8 model: {e}")
            self.model = None
    
    def decode_frame(self, frame_data: str) -> np.ndarray:
        """Decode base64 frame data to OpenCV image"""
        try:
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            img_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def detect_faces(self, img: np.ndarray) -> Tuple[int, list]:
        """
        Detect faces using YOLOv8-face or person detection
        
        Returns:
            Tuple of (face_count, face_bounding_boxes)
        """
        if img is None:
            return 0, []
        
        try:
            if self.face_model is not None:
                # Use specialized face model
                results = self.face_model(img, verbose=False, conf=0.4)
                faces = []
                for r in results:
                    for box in r.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        faces.append([int(x1), int(y1), int(x2 - x1), int(y2 - y1)])
                return len(faces), faces
            
            elif self.model is not None:
                # Fallback: use general model to detect persons
                results = self.model(img, verbose=False, conf=0.5, classes=[self.PERSON_CLASS])
                persons = []
                for r in results:
                    for box in r.boxes:
                        if int(box.cls[0]) == self.PERSON_CLASS:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            persons.append([int(x1), int(y1), int(x2 - x1), int(y2 - y1)])
                return len(persons), persons
            
            return 0, []
        except Exception as e:
            print(f"Error detecting faces with YOLO: {e}")
            return 0, []
    
    def detect_looking_away(self, img: np.ndarray, faces: list) -> bool:
        """
        Detect if candidate is looking away based on face position and size
        
        Uses face bounding box position relative to frame center.
        If the face is significantly off-center, the candidate may be looking away.
        """
        if img is None or len(faces) == 0:
            return False
        
        try:
            h, w = img.shape[:2]
            frame_center_x = w / 2
            frame_center_y = h / 2
            
            # Get the primary face (largest)
            face = max(faces, key=lambda f: f[2] * f[3])
            fx, fy, fw, fh = face
            
            # Face center
            face_center_x = fx + fw / 2
            face_center_y = fy + fh / 2
            
            # Calculate horizontal offset ratio (0 = centered, 1 = edge)
            offset_x = abs(face_center_x - frame_center_x) / (w / 2)
            offset_y = abs(face_center_y - frame_center_y) / (h / 2)
            
            # If face is too far from center, likely looking away
            # Threshold: > 0.55 means face center is >55% away from frame center
            if offset_x > 0.55 or offset_y > 0.6:
                return True
            
            # Also check if face is very small (far from camera = potentially looking away)
            face_area_ratio = (fw * fh) / (w * h)
            if face_area_ratio < 0.02:  # Face is less than 2% of frame
                return True
            
            return False
        except Exception as e:
            print(f"Error detecting looking away: {e}")
            return False
    
    def detect_phone(self, img: np.ndarray) -> bool:
        """
        Detect phone in the image using YOLOv8 object detection
        
        YOLOv8 can detect 'cell phone' (class 67) from the COCO dataset
        """
        if img is None or self.model is None:
            return False
        
        try:
            # Detect cell phones and books (potential cheat sheets)
            results = self.model(
                img, 
                verbose=False, 
                conf=0.35,  # Lower confidence threshold for phone detection
                classes=[self.CELL_PHONE_CLASS, self.BOOK_CLASS]
            )
            
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if cls_id == self.CELL_PHONE_CLASS and conf > 0.35:
                        print(f"📱 Phone detected with confidence: {conf:.2f}")
                        return True
                    
                    if cls_id == self.BOOK_CLASS and conf > 0.5:
                        # Books need higher confidence to avoid false positives
                        print(f"📖 Book/cheat sheet detected with confidence: {conf:.2f}")
                        return True
            
            return False
        except Exception as e:
            print(f"Error detecting phone: {e}")
            return False
    
    def process(self, frame_data: str) -> Dict:
        """
        Process a single frame and return detection results
        """
        img = self.decode_frame(frame_data)
        
        if img is None:
            return {
                'face_count': 0,
                'looking_away': False,
                'phone_detected': False,
                'timestamp': datetime.utcnow().isoformat(),
                'error': 'Failed to decode frame'
            }
        
        # Detect faces
        face_count, faces = self.detect_faces(img)
        
        # Detect looking away (only if exactly 1 face)
        looking_away = False
        if face_count == 1:
            looking_away = self.detect_looking_away(img, faces)
        
        # Detect phone (real detection via YOLOv8!)
        phone_detected = self.detect_phone(img)
        
        return {
            'face_count': face_count,
            'looking_away': looking_away,
            'phone_detected': phone_detected,
            'timestamp': datetime.utcnow().isoformat()
        }


class HaarCascadeFrameProcessor:
    """Fallback: OpenCV Haar Cascade-based frame analysis"""
    
    def __init__(self):
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            print("✓ OpenCV Haar cascades loaded (fallback mode)")
        except Exception as e:
            print(f"⚠ Warning: Could not load OpenCV cascades: {e}")
            self.face_cascade = None
            self.eye_cascade = None
    
    def decode_frame(self, frame_data: str) -> np.ndarray:
        try:
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            img_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def detect_faces(self, img):
        if img is None or self.face_cascade is None:
            return 0, []
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            return len(faces), faces
        except:
            return 0, []
    
    def detect_looking_away(self, img, faces):
        if img is None or self.eye_cascade is None or len(faces) == 0:
            return False
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            (x, y, w, h) = faces[0]
            roi_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))
            return len(eyes) < 2
        except:
            return False
    
    def process(self, frame_data: str) -> Dict:
        img = self.decode_frame(frame_data)
        if img is None:
            return {'face_count': 0, 'looking_away': False, 'phone_detected': False, 'timestamp': datetime.utcnow().isoformat(), 'error': 'Failed to decode frame'}
        
        face_count, faces = self.detect_faces(img)
        looking_away = False
        if face_count == 1:
            looking_away = self.detect_looking_away(img, faces)
        
        return {
            'face_count': face_count,
            'looking_away': looking_away,
            'phone_detected': False,  # Not available with Haar Cascade
            'timestamp': datetime.utcnow().isoformat()
        }


# Global instance
_processor = None


def get_processor():
    """Get or create global processor instance - uses YOLOv8 if available"""
    global _processor
    if _processor is None:
        if YOLO_AVAILABLE:
            _processor = YOLOFrameProcessor()
            if _processor.model is not None:
                print("✓ Using YOLOv8 for proctoring (face + phone detection)")
            else:
                print("⚠ YOLOv8 model failed to load, falling back to Haar Cascade")
                _processor = HaarCascadeFrameProcessor()
        else:
            _processor = HaarCascadeFrameProcessor()
    return _processor


def process_frame(frame_data: str) -> Dict:
    """
    Process a frame using the best available processor
    
    Uses YOLOv8 if available, falls back to OpenCV Haar Cascade
    """
    processor = get_processor()
    return processor.process(frame_data)
