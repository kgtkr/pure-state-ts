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
    return new State(s => [null, { ...s, [key]: x }]) as any;
  }

  static modifyAll<S extends object>(f: (s: S) => S): State<S, null> {
    return State.getAll<S>()
      .then(s => State.putAll(f(s)));
  }

  static modify<S extends object, K extends keyof S>(key: K, f: (s: S[K]) => S[K]): State<S, null> {
    return State.get<S, K>(key)
      .then(s => State.put(key, f(s)));
  }
}
