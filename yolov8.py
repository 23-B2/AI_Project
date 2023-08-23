# https://docs.ultralytics.com/tasks/
# YOLOv8
from ultralytics import YOLO
import cv2

# title, model = 'detection', YOLO('yolov8n.pt')
title, model = 'segmentation', YOLO('yolov8n-seg.pt')
# title, model = 'classification', YOLO('yolov8n-cls.pt')
# title, model = 'pose', YOLO('yolov8n-pose.pt')
# result = model('https://ultralytics.com/images/bus.jpg')

cap = cv2.VideoCapture(0)
while cap.isOpened():
    success, image = cap.read()
    if not success:
        continue

    result = model(image)
    img_array = result[0].plot()
    cv2.imshow(title, cv2.flip(img_array[::-1], 0))

    if cv2.waitKey(5) & 0xFF == 27:
        break