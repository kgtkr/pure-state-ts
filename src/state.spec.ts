import { State, state } from "./state";

describe("State", () => {
  describe("new", () => {
    it("正常に生成できるか", () => {
      const st = new State<{ x: number }, string>(s => [s.x.toString(), { ...s, x: s.x + 1 }]);
      expect(st.run({ x: 3 })).toEqual(["3", { x: 4 }]);
    });
  });

  describe("map", () => {
    it("map", () => {
      const st = state<{}, number>(s => [1, s])
        .map(x => x + 1);
      expect(st.run({})).toEqual([2, {}]);
    });
  });
});