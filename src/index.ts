import MD5 from "crypto-js/md5";
import workerScript from "./Worker/worker";
// import DecoderManager from "./DecoderManager/index";
import { SoftAvifWebOptions } from "./types/SoftAvifWebType";
import { deepMixins } from "./utils";
import AnimationPlayback from "./AnimationPlayback";
import {
  DecoderChannel,
  DecoderEventMap,
  WorkerAvifDecoderMessageChannel,
} from "./types/WorkerMessageType";
import { Decoder } from "./Decoder";
import { PlayChannelType } from "./AnimationPlayback/type";
import { LibavifDecoder } from "./Decoder/LibavifDecoder";

const blob = new Blob([workerScript], { type: "text/javascript" });
const workerDecoderUrl = URL.createObjectURL(blob);

export default class SoftAvifWeb {
  url: string | Uint8Array;
  /**
   * 可选配置
   */
  private option: SoftAvifWebOptions;
  /**
   * DecoderManager的管理对象，这个是全局共享的，注册到`window._SoftAvifWebDecoderManager`
   */
  // private decoderManager: DecoderManager;
  /**
   * avif的Uint8Array文件数据
   */
  private avifFileArrayBuffer?: ArrayBuffer;
  /**
   * 唯一资源标识
   */
  resourceSymbolId?: string;
  /**
   * 播放对象
   */
  private animationPlayback: AnimationPlayback<Decoder<DecoderEventMap>>;

  libavifDecoder: LibavifDecoder;

  constructor(
    url: string | Uint8Array,
    canvas: string | HTMLCanvasElement | SoftAvifWebOptions,
    option: SoftAvifWebOptions = {}
  ) {
    if (typeof canvas === "string" || canvas instanceof HTMLCanvasElement) {
      option.canvas = canvas;
    } else if (canvas instanceof Object) {
      option = canvas;
    }
    // 合并配置项
    this.option = deepMixins(option, {
      decodeImmediately: true,
      webgl: false,
      autoplay: false,
    } as SoftAvifWebOptions);
    // 判断是元素id还是DOM对象
    if (typeof this.option.canvas === "string") {
      this.option.canvas = document.getElementById(
        this.option.canvas
      ) as HTMLCanvasElement;
    }

    this.checkConstructor(url, this.option);
    this.url = url;
    this.resourceSymbolId = MD5(url as string).toString();
    this.libavifDecoder = new LibavifDecoder(
      workerDecoderUrl,
      this.resourceSymbolId
    );

    this.animationPlayback = new AnimationPlayback(
      this.option.canvas as HTMLCanvasElement,
      this.libavifDecoder,
      {
        webgl: this.option.webgl,
        loop: this.option.loop,
      }
    );
    if (this.option.autoplay)
      this.libavifDecoder.onmessageOnce(
        WorkerAvifDecoderMessageChannel.initial,
        () => {
          this.decoderParsePlay(this.url);
        }
      );
  }

  pause() {
    this.animationPlayback.pause();
  }

  play() {
    if (this.animationPlayback.paused) {
      this.animationPlayback.play();
    } else if (!this.animationPlayback.playing) {
      this.decoderParsePlay(this.url);
    }
  }

  private async decoderParsePlay(url: string | ArrayBuffer) {
    if (!this.libavifDecoder.decoderParseComplete) {
      this.libavifDecoder.once(
        DecoderChannel.avifParse,
        ({ width, height }) => {
          (this.option.canvas as HTMLCanvasElement).width = width;
          (this.option.canvas as HTMLCanvasElement).height = height;
        }
      );
      this.avifFileArrayBuffer = await this.fillArrayBuffer(url);
      await this.libavifDecoder.decoderParse(this.avifFileArrayBuffer!);
      this.animationPlayback.initRender();
    }
    this.animationPlayback.play();
  }

  /**
   * 获取avif文件的Uint8Array数据
   * @param url
   * @returns
   */
  private async fillArrayBuffer(url: string | ArrayBuffer) {
    if (typeof url === "string") {
      return await this.fetchFileArrayBuffer(url);
    } else if (url instanceof ArrayBuffer) {
      return url;
    } else {
      throw new Error("请传入文件Url或Uint8Array数据对象");
    }
  }

  private async fetchFileArrayBuffer(url: string) {
    const res = await fetch(url);
    return await res.arrayBuffer();
  }
  /**
   * 检查构造参数
   * @param url
   * @param option
   */
  private checkConstructor(
    url: string | Uint8Array,
    option: SoftAvifWebOptions
  ) {
    if (!url) throw new Error("请传入Avif文件Url或Uint8Array文件数据");
    if (
      typeof option.canvas !== "string" &&
      !((option.canvas as any) instanceof HTMLCanvasElement)
    )
      throw new Error("请传入canvas元素ID或canvas DOM对象");
  }
}
