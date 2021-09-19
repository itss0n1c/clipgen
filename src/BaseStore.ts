/* eslint-disable no-undefined */
/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
interface objarr extends Object {
	[name: string]: unknown;
}

export default class BaseStore<K, V> extends Map<K, V> {
	private _array: V[] | undefined;
	private _obj: objarr | undefined;
	constructor (entries?: ReadonlyArray<readonly [K, V]>) {
		super(entries);
		Object.defineProperty(this, '_array', { value: null,
			writable: true,
			configurable: true });
		Object.defineProperty(this, '_obj', { value: null,
			writable: true,
			configurable: true });
	}

	has (k: K): boolean {
		return super.has(k);
	}

	get (k: K): V | undefined {
		return super.get(k);
	}

	set (k: K, v: V): this {
		this._array = undefined;
		return super.set(k, v);
	}

	clearArray (): void {
		this._array = undefined;
		this._obj = undefined;
	}

	delete (k: K): boolean {
		this._array = undefined;
		this._obj = undefined;
		return super.delete(k);
	}

	clear (): void {
		return super.clear();
	}

	array (): V[] {
		if (!this._array || this._array.length !== this.size) {
			this._array = [ ...this.values() ];
		}
		return this._array;
	}

	keyArray (): objarr | undefined {
		if (!this._obj || Object.keys(this._obj).length !== this.size) {
			this._obj = Object.fromEntries(this);
		}
		return this._obj;
	}

	public find(fn: (value: V, key: K, obj: this) => boolean): V | undefined;
	public find<T>(fn: (this: T, value: V, key: K, obj: this) => boolean, thisArg: T): V | undefined;
	public find (fn: (value: V, key: K, obj: this) => boolean, thisArg?: unknown): V | undefined {
		if (typeof thisArg !== 'undefined') {
			fn = fn.bind(thisArg);
		}
		for (const [ key, val ] of this) {
			if (fn(val, key, this)) {
				return val;
			}
		}
		// eslint-disable-next-line no-undefined
		return undefined;
	}
}

