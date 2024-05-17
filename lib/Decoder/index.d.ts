import { Observer } from "../Observer";
import { DecoderImageData } from "../types/WorkerMessageType";
declare abstract class DecoderAbstract {
    /**
     * 进行解码操作
     * @param arrayBuffer
     */
    abstract decoder(arrayBuffer: ArrayBuffer): Promise<boolean>;
}
export declare class Decoder<M> extends Observer<M> implements DecoderAbstract {
    /**
     * 所有帧已成功解码完成
     */
    decoderImageComplete: boolean;
    /**
     * 文件解析完成
     */
    decoderParseComplete: boolean;
    /**
     * 解码器初始化完成
     */
    decoderInitial: boolean;
    /**
     * 解码器版本
     */
    decoderVersion: string;
    /**
     * 解码的帧数据集合
     */
    frames: (DecoderImageData | number)[];
    /**
     * 帧数
     */
    imageCount: number;
    constructor();
    decoder(arrayBuffer: ArrayBuffer): Promise<boolean>;
}
export declare class MainEventEmitter<W, M> extends Decoder<M> {
    private workerListeners;
    worker: Worker;
    constructor(url: string);
    /**
     * 发送事件到Worker线程
     * @param channel
     * @param data
     * @param args
     */
    postMessage<T extends keyof W>(channel: T, data: W[T], arrayBuffer?: ArrayBuffer): void;
    /**
     * 为给定的Worker线程事件添加一次性侦听器。
     * @param channel 频道
     * @param handler 事件回调
     * @returns
     */
    onmessageOnce<T extends keyof W>(channel: T, handler: (this: this, ev: W[T], arrayBuffer?: ArrayBuffer) => void): this;
    /**
     * 清除Worker线程事件
     * @param channel
     * @param handler
     * @returns
     */
    clearOnmessage<T extends keyof W>(channel: T, handler: (data: W[T]) => void): boolean;
    /**
     * 监听Worker线程发送的事件
     * @param channel
     * @param handler
     */
    onmessage<T extends keyof W>(channel: T, handler: (data: W[T], arrayBuffer?: ArrayBuffer) => void): void;
    private listenOnmessage;
}
export {};
