import { Overwrite } from "type-zoo";

export type StateFn<S1 extends object, S2 extends object, T> = (state: S1) => [T, S2];

export type Key = string | symbol | number;

export function state<S1 extends object, S2 extends object, T>(fn: StateFn<S1, S2, T>): State<S1, S2, T> {
  return new State(fn);
}

export class State<S1 extends object, S2 extends object, T>{
  constructor(private readonly fn: StateFn<S1, S2, T>) {
  }

  static pure<S extends object, T>(x: T): State<S, S, T> {
    return new State(s => [x, s]);
  }

  run(state: S1): [T, S2] {
    return this.fn(state);
  }

  map<P>(f: (x: T) => P): State<S1, S2, P> {
    return new State(s1 => {
      const [res, s2] = this.fn(s1);
      return [f(res), s2];
    });
  }

  then<A extends object, P>(f: (x: T) => State<S2, A, P>): State<S1, A, P> {
    return new State<S1, A, P>(s => {
      const [a, newState] = this.fn(s);
      return f(a).fn(newState);
    });
  }

  static getAll<S extends object>(): State<S, S, S> {
    return new State(s => [s, s]);
  }

  static get<S extends object, K extends keyof S>(key: K): State<S, S, S[K]> {
    return new State(s => [s[key], s]);
  }

  static putAll<S1 extends object, S2 extends object>(x: S2): State<S1, S2, null> {
    return new State<S1, S2, null>(_s => [null, x]);
  }

  static put<S extends object, K extends Key, T>(key: K, x: T): State<S, Overwrite<S, { [P in K]: T }>, null> {
    return new State(s => [null, { ...s, [key]: x }]) as any;
  }

  static modifyAll<S1 extends object, S2 extends object>(f: (s: S1) => S2): State<S1, S2, null> {
    return State.getAll<S1>()
      .then(s => State.putAll(f(s)));
  }

  static modify<S extends object, K extends keyof S, T>(key: K, f: (s: S[K]) => T): State<S, Overwrite<S, { [P in K]: T }>, null> {
    return State.get<S, K>(key)
      .then(s => State.put(key, f(s)));
  }
}
