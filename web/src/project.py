from __future__ import print_function

import torch
import torch.nn.functional as F

from PIL import Image

import torchvision.transforms as transforms
import torchvision.models as models

from lpips import LPIPS


import time

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
imsize = 512

loader = transforms.Compose([
    transforms.Resize((imsize, imsize)),
    transforms.ToTensor()])

def to_PIL(tensor):
    toPIL = transforms.Compose([transforms.ToPILImage()])
    return toPIL(tensor.data[0].cpu().clamp(0, 1))

def image_loader(image_name):
    image = Image.open(image_name)
    image = loader(image).unsqueeze(0)
    return image.to(device, torch.float)

def get_transferred_file(content_filepath, style_filepath):
    time.sleep(1)
    return './temp/transfer/result.jpg'

def get_noise_file(content_filepath, style_transferred_filepath):
    content_image = image_loader(content_filepath)
    style_transferred_image = image_loader(style_transferred_filepath)

    feature_extractor = models.vgg19(pretrained=True).features.to(device).eval()
    lpips_model = LPIPS(net='vgg').cuda()
    alpha = 0.5
    p = 0.07

    delta_x = torch.zeros_like(content_image, requires_grad=True).cuda()
    optimizer = torch.optim.Adam([delta_x], lr=0.01)

    for _ in range(500):
        optimizer.zero_grad()

        perturbed_image = content_image + delta_x

        loss = F.smooth_l1_loss(feature_extractor(style_transferred_image), feature_extractor(perturbed_image))
        perceptual_loss = lpips_model(content_image, perturbed_image)
        penalty = alpha * torch.clamp(perceptual_loss - p, min=0)
        total_loss = loss + penalty

        total_loss.backward()
        optimizer.step()

        with torch.no_grad():
            delta_x.clamp_(-p, p)

    to_PIL(content_image+delta_x).save("./temp/output/result.jpg")
    return './temp/output/result.jpg'