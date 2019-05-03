import { Overwrite } from "type-zoo";

export type StateFn<S extends object, T> = (state: S) => [T, S];

export type Key = string | symbol | number;

export function state<S extends object, T>(fn: StateFn<S, T>): State<S, T> {
  return new State(fn);
}

export class State<S extends object, T>{
  constructor(private readonly fn: StateFn<S, T>) {
  }

  static pure<S extends object, T>(x: T): State<S, T> {
    return new State(s => [x, s]);
  }

  static empty(): State<{}, null> {
    return State.pure(null);
  }

  run(state: S): [T, S] {
    return this.fn(state);
  }

  map<P>(f: (x: T) => P): State<S, P> {
    return new State(s1 => {
      const [res, s2] = this.fn(s1);
      return [f(res), s2];
    });
  }

  then<R>(f: (x: T) => State<S, R>): State<S, R> {
    return new State<S, R>(s => {
      const [a, newState] = this.fn(s);
      return f(a).fn(newState);
    });
  }

  static getAll<S extends object>(): State<S, S> {
    return new State(s => [s, s]);
  }

  static get<S extends object, K extends keyof S>(key: K): State<S, S[K]> {
    return new State(s => [s[key], s]);
  }

  static putAll<S extends object>(x: S): State<S, null> {
    return new State<S, null>(_s => [null, x]);
  }

  static put<S extends object, K extends keyof S>(key: K, x: S[K]): State<S, null> {
    return new State(s => [null, { ...s, [key]: x }]);
  }

  static modifyAll<S extends object>(f: (s: S) => S): State<S, null> {
    return State.getAll<S>()
      .then(s => State.putAll(f(s)));
  }

  static modify<S extends object, K extends keyof S>(key: K, f: (s: S[K]) => S[K]): State<S, null> {
    return State.get<S, K>(key)
      .then(s => State.put(key, f(s)));
  }

  defineAnd<D extends object, R>(valueFn: (x: T) => D, f: State<Overwrite<S, D>, R>): State<S, R> {
    return new State<S, R>(s => {
      const [x1, newState1] = this.fn(s);
      const value = valueFn(x1);

      // 定義された変数を元に戻すためのデータ
      const data: {
        k: Key,
        v: { value: any } | null
      }[] = [];
      for (let key of Object.keys(value)) {
        if (key in newState1) {
          data.push({ k: key, v: { value: (value as any)[key] } });
        } else {
          data.push({ k: key, v: null });
        }
      }

      const [x2, newState2] = f.fn({ ...newState1, ...value } as any);

      const resState = { ...newState2 };
      for (let { k, v } of data) {
        if (v !== null) {
          (resState as any)[k] = v;
        } else {
          delete (resState as any)[k];
        }
      }

      return [x2, resState as any];
    });
  }
}
