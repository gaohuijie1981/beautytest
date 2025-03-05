import { BeautyPixel } from 'beautypixel';
import * as faceapi from "face-api.js";

class App {
  private canvas: HTMLCanvasElement;
  private beautyPixel: BeautyPixel;
  private imageUrl: string;

  private updateValueDisplay(slider: HTMLInputElement): void {
    const valueDisplay = slider.parentElement?.querySelector('.value');
    if (valueDisplay) {
      valueDisplay.textContent = slider.value;
    }
  }

  private async processImageAsync(image: HTMLImageElement): Promise<void> {
      // 图片分辨率
      const imageWidth = image.width;
      const imageHeight = image.height;
      this.canvas.width = imageWidth;
      this.canvas.height = imageHeight;

      // 显示分辨率
      const canvasHeight = document.documentElement.clientHeight;
      const canvasWidth = document.documentElement.clientHeight / imageHeight * imageWidth;
      this.canvas.style.width = canvasWidth + 'px';
      this.canvas.style.height = canvasHeight + 'px';

      // 获取face-api/68点人脸坐标
      const results = await faceapi.detectAllFaces(image).withFaceLandmarks(true);
      const points = results[0].landmarks.positions;
      if (points.length !== 68) throw Error('Face landmark number mismtach');

      // 正则化face-api/68点人脸坐标
      const normalizedFacePoints = new Float32Array(72 * 2);
      for (let i = 0; i < 68; i++) {
        normalizedFacePoints[i * 2] = points[i].x / imageWidth;
        normalizedFacePoints[i * 2 + 1] = points[i].y / imageHeight;
      }

      // 计算右眼睛相关坐标（用于大眼效果）
      normalizedFacePoints[68 * 2] = (normalizedFacePoints[37 * 2] + normalizedFacePoints[38 * 2]) / 2;
      normalizedFacePoints[68 * 2 + 1] = (normalizedFacePoints[37 * 2 + 1] + normalizedFacePoints[38 * 2 + 1]) / 2;
      normalizedFacePoints[69 * 2] = (normalizedFacePoints[37 * 2] + normalizedFacePoints[38 * 2] + normalizedFacePoints[40 * 2] + normalizedFacePoints[41 * 2]) / 4;
      normalizedFacePoints[69 * 2 + 1] = (normalizedFacePoints[37 * 2 + 1] + normalizedFacePoints[38 * 2 + 1] + normalizedFacePoints[40 * 2 + 1] + normalizedFacePoints[41 * 2 + 1]) / 4;

      // 计算左眼睛相关坐标（用于大眼效果）
      normalizedFacePoints[70 * 2] = (normalizedFacePoints[43 * 2] + normalizedFacePoints[44 * 2]) / 2;
      normalizedFacePoints[70 * 2 + 1] = (normalizedFacePoints[43 * 2 + 1] + normalizedFacePoints[44 * 2 + 1]) / 2;
      normalizedFacePoints[71 * 2] = (normalizedFacePoints[43 * 2] + normalizedFacePoints[44 * 2] + normalizedFacePoints[46 * 2] + normalizedFacePoints[47 * 2]) / 4;
      normalizedFacePoints[71 * 2 + 1] = (normalizedFacePoints[43 * 2 + 1] + normalizedFacePoints[44 * 2 + 1] + normalizedFacePoints[46 * 2 + 1] + normalizedFacePoints[47 * 2 + 1]) / 4;

      // 设置人脸相操作开启
      this.beautyPixel.setValid(true);
      // 设置人脸相关坐标
      this.beautyPixel.setFacePoints(normalizedFacePoints);

      // 处理图像
      this.beautyPixel.refresh();

  }

  private uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        this.imageUrl = e.target?.result as string;
        const image = await this.beautyPixel.setImageUrlAsync(this.imageUrl);
        await this.processImageAsync(image);
      };
      reader.readAsDataURL(file);
    }
  }
  
  constructor() {

    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
    if (!canvas) throw new Error('Canvas not found');

    this.canvas = canvas;
    this.beautyPixel = new BeautyPixel(this.canvas);

    // 设置用户界面
    const tempSlider = document.querySelector<HTMLInputElement>('#temp');
    tempSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setTemperature(parseInt(value));
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const tintSlider = document.querySelector<HTMLInputElement>('#tint');
    tintSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setTint(parseInt(value));
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const blurSlider = document.querySelector<HTMLInputElement>('#blur');
    blurSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setBlur(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const whitenSlider = document.querySelector<HTMLInputElement>('#whiten');
    whitenSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setWhiten(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const thinSlider = document.querySelector<HTMLInputElement>('#thin');
    thinSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setFace(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const eyeSlider = document.querySelector<HTMLInputElement>('#eye');
    eyeSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setEye(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      this.beautyPixel.refresh();
    });

    const fileUpload = document.querySelector<HTMLInputElement>('#file');
    fileUpload?.addEventListener('change', (e) => {
      this.uploadImage(e);
    });

    const saveButton = document.querySelector<HTMLButtonElement>('#save');
    saveButton?.addEventListener('click', (e) => {
      this.beautyPixel.save('output.png');
    });

    let lastRenderTime = 0;

    // 将刷新设置为1FPS防止卡死
    const render = () => {
      const now = Date.now();
      if (now - lastRenderTime >= 1000) {
        this.beautyPixel.render();
        lastRenderTime = now;
      }
      requestAnimationFrame(render);
    };

    setTimeout(async() => {

      // 载入face-api模型
      const loading = document.querySelector<HTMLButtonElement>('#loading');
      if (loading && loading.style) loading.style.display = 'block';
      await faceapi.nets.ssdMobilenetv1.loadFromUri('./models');
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('./models');
      if (loading && loading.style) loading.style.display = 'none';

      // 载入并处理图像
      const image = await this.beautyPixel.setImageUrlAsync('./face.png');
      await this.processImageAsync(image);
      
      requestAnimationFrame(render);

    }, 100);
  }
}

new App();