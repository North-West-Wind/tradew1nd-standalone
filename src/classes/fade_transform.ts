import { Transform, TransformCallback, TransformOptions } from "stream";

interface FadeTransformOpts extends TransformOptions {
  volume?: number;
  fadeTime?: number;
  type?: "s16le" | "s16be" | "s32le" | "s32be";
  rate?: number;
  channels?: number;
}

/**
 * Only supports s16le streams (works with Discord.js)
 */
class FadeTransform extends Transform {
  volume: number;
  fadeTime: number;
  rate: number;
  channels: number;

  private _actualVolume: number;

  private _chunk: Buffer | null = Buffer.allocUnsafe(0);

  private _readInt: (buffer: Buffer, index: number) => number;
  private _writeInt: (buffer: Buffer, int: number, index: number) => number;
  private _bits;
  private _bytes;
  private _extremum;
  private _currentFade: {
    incrementPerSample: number;
    resolve: (finished: boolean) => void;
  } | null = null;

  constructor(opts?: FadeTransformOpts) {
    super(opts);

    this.volume = opts?.volume ?? 1.0;
    this.fadeTime = opts?.fadeTime ?? 0;
    this.rate = opts?.rate ?? 48000;
    this.channels = opts?.channels ?? 2;
    this._actualVolume = this.volume;

    switch (opts?.type ?? "s16le") {
      case "s16le":
        this._readInt = (buffer, index) => buffer.readInt16LE(index);
        this._writeInt = (buffer, int, index) =>
          buffer.writeInt16LE(int, index);
        this._bits = 16;
        break;
      case "s16be":
        this._readInt = (buffer, index) => buffer.readInt16BE(index);
        this._writeInt = (buffer, int, index) =>
          buffer.writeInt16BE(int, index);
        this._bits = 16;
        break;
      case "s32le":
        this._readInt = (buffer, index) => buffer.readInt32LE(index);
        this._writeInt = (buffer, int, index) =>
          buffer.writeInt32LE(int, index);
        this._bits = 32;
        break;
      case "s32be":
        this._readInt = (buffer, index) => buffer.readInt32BE(index);
        this._writeInt = (buffer, int, index) =>
          buffer.writeInt32BE(int, index);
        this._bits = 32;
        break;
      default:
        throw new Error(
          "VolumeTransformer type should be one of s16le, s16be, s32le, s32be"
        );
    }

    this._bytes = this._bits / 8;
    this._extremum = Math.pow(2, this._bits - 1);
    this._chunk = Buffer.alloc(0);
  }

  get actualVolume() {
    return this._actualVolume;
  }

  clear() {
    this._actualVolume = this.volume;
    this._chunk = Buffer.alloc(0);
  }

  _transform(
    nextChunk: any,
    _encoding: BufferEncoding,
    done: TransformCallback
  ) {
    if (
      this.volume === 1 &&
      Math.abs(this.volume - this._actualVolume) < 0.001
    ) {
      this._actualVolume = this.volume;
      this._currentFade?.resolve(true);
      this.push(nextChunk);
      return done();
    }

    const chunk = (this._chunk = Buffer.concat([this._chunk, nextChunk]));
    if (this._chunk.length < this._bytes) return done();

    const transformed = Buffer.allocUnsafe(chunk.length);
    const complete = Math.floor(chunk.length / this._bytes) * this._bytes;

    if (
      this._currentFade &&
      Math.abs(this.volume - this._actualVolume) < 0.001
    ) {
      this._actualVolume = this.volume;
      this._currentFade.resolve(true);
      this._currentFade = null;
    }

    const inc = this._currentFade?.incrementPerSample || 0;

    for (let i = 0; i < complete; i += this._bytes) {
      if (
        (inc < 0 && this._actualVolume < this.volume) ||
        (inc > 0 && this.actualVolume > this.volume)
      ) {
        this._actualVolume = this.volume;
        this._currentFade?.resolve(true);
        this._currentFade = null;
      } else this._actualVolume += inc;

      const int = Math.min(
        this._extremum - 1,
        Math.max(
          -this._extremum,
          Math.floor(this._actualVolume * this._readInt(chunk, i))
        )
      );
      this._writeInt(transformed, int, i);
    }

    this._chunk = chunk.slice(complete);
    this.push(transformed);
    return done();
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void) {
    this._chunk = null;
    super._destroy(error, callback);
  }

  async setVolume(volume: number) {
    if (this._currentFade) this._currentFade.resolve(false);
    return new Promise<boolean>((resolve, reject) => {
      this.volume = volume;
      // const incrementPerSample = 0.0000001;
      const incrementPerSample =
        this.fadeTime < 0.01
          ? 2.0
          : (this.volume - this._actualVolume) /
            (this.fadeTime * this.rate * this.channels);
      this._currentFade = { incrementPerSample, resolve };
    });
  }
}

export default FadeTransform;
