import { State } from "./state";

describe("State", () => {
  describe("state", () => {
    it("state", () => {
      const st = State.state<{ x: number }, string>(s => [s.x.toString(), { ...s, x: s.x + 1 }]);
      expect(st.run({ x: 3 })).toEqual(["3", { x: 4 }]);
    });
  });

  describe("map", () => {
    it("map", () => {
      const st = State.state<{}, number>(s => [1, s])
        .map(x => x + 1);
      expect(st.run({})).toEqual([2, {}]);
    });
  });

  describe("then", () => {
    it("then", () => {
      const st = State.state<{ x: number }, string>(s => ["s", s])
        .then(x => State.state(s => [x + s.x, { ...s, x: s.x + 1 }]));

      expect(st.run({ x: 1 })).toEqual(["s1", { x: 2 }]);
    });
  });

  describe("getAll", () => {
    it("getAll", () => {
      const st = State.getAll<{ x: number }>();
      expect(st.run({ x: 2 })).toEqual([{ x: 2 }, { x: 2 }]);
    });
  });

  describe("get", () => {
    it("get", () => {
      const st = State.get<{ x: number, y: string }, "y">("y");
      expect(st.run({ x: 0, y: "" })).toEqual(["", { x: 0, y: "" }]);
    });
  });
});