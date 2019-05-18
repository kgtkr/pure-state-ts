import { Overwrite } from "type-zoo";
import { right } from "fp-ts/lib/Either";
export type StateFn<S extends object, A> = (state: S) => [A, S];

type Cast<A, B> = A extends B ? A : B;

type KeyFilter<A, P extends object, _Temp extends keyof P = keyof P> = _Temp extends infer X ? (P[Cast<X, keyof P>] extends A ? X : never) : never;
type PassObj<S extends object, ThenState extends object> = { [P in keyof ThenState]: KeyFilter<ThenState[P], S> };

// TODO: passAndThenに同じ変数を渡しても対応出来るようにしたい

export class ObjectState<S extends object, A>{
  private constructor(private readonly fn: StateFn<S, A>) {
  }

  static state<S extends object, A>(fn: StateFn<S, A>): ObjectState<S, A> {
    return new ObjectState(fn);
  }

  static of<S extends object, A>(x: A): ObjectState<S, A> {
    return new ObjectState(s => [x, s]);
  }

  static empty(): ObjectState<{}, null> {
    return ObjectState.of(null);
  }

  run(state: S): [A, S] {
    return this.fn(state);
  }

  runEmpty(this: ObjectState<{}, A>): A {
    return this.fn({})[0];
  }

  eval(state: S): A {
    return this.fn(state)[0];
  }

  exec(state: S): S {
    return this.fn(state)[1];
  }

  map<P>(f: (x: A) => P): ObjectState<S, P> {
    return new ObjectState(s1 => {
      const [res, s2] = this.fn(s1);
      return [f(res), s2];
    });
  }

  then<R>(f: (x: A) => ObjectState<S, R>): ObjectState<S, R> {
    return new ObjectState<S, R>(s => {
      const [a, newState] = this.fn(s);
      return f(a).fn(newState);
    });
  }

  and<R>(s: ObjectState<S, R>): ObjectState<S, R> {
    return this.then(() => s);
  }

  static getAll<S extends object>(): ObjectState<S, S> {
    return new ObjectState(s => [s, s]);
  }

  static get<S extends object, K extends keyof S>(key: K): ObjectState<S, S[K]> {
    return new ObjectState(s => [s[key], s]);
  }

  static putAll<S extends object>(x: S): ObjectState<S, null> {
    return new ObjectState<S, null>(_s => [null, x]);
  }

  static put<S extends object, K extends keyof S>(key: K, x: S[K]): ObjectState<S, null> {
    return new ObjectState(s => [null, { ...s, [key]: x }]);
  }

  static modifyAll<S extends object>(f: (s: S) => S): ObjectState<S, null> {
    return ObjectState.getAll<S>()
      .then(s => ObjectState.putAll(f(s)));
  }

  static modify<S extends object, K extends keyof S>(key: K, f: (s: S[K]) => S[K]): ObjectState<S, null> {
    return ObjectState.get<S, K>(key)
      .then(s => ObjectState.put(key, f(s)));
  }

  defineAnd<D extends object, R>(valueFn: (x: A) => D, f: ObjectState<Overwrite<S, D>, R>): ObjectState<S, R> {
    return new ObjectState<S, R>(s => {
      const [x1, newState1] = this.fn(s);
      const value = valueFn(x1);

      // 定義された変数を元に戻すためのデータ
      const data: {
        k: keyof any,
        v: { value: any } | null
      }[] = [];
      for (let key of Object.keys(value)) {
        if (key in newState1) {
          data.push({ k: key, v: { value: (s as any)[key] } });
        } else {
          data.push({ k: key, v: null });
        }
      }

      const [x2, newState2] = f.fn({ ...newState1, ...value } as any);

      // データを元に戻す
      const resState = { ...newState2 };
      for (let { k, v } of data) {
        if (v !== null) {
          (resState as any)[k] = v.value;
        } else {
          delete (resState as any)[k];
        }
      }

      return [x2, resState as any];
    });
  }

  passAndThen<ThenState extends object, R>(f: (x: A) => ObjectState<ThenState, R>, pass: PassObj<S, ThenState>): ObjectState<S, R> {
    return new ObjectState<S, R>(s => {
      const [a, newState] = this.fn(s);
      const passState: any = {};
      for (let key of Object.keys(pass)) {
        passState[key] = (newState as any)[(pass as any)[key]];
      }
      const [b, newPassState] = f(a).fn(passState);
      const resState: any = { ...newState };

      for (let key of Object.keys(pass)) {
        resState[(pass as any)[key]] = (newPassState as any)[key];
      }

      return [b, resState];
    });
  }
}
