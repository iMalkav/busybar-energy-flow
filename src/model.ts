import { record, num, cycle, requiredNumber, Feed, type View } from "./lib.ts";

export class AppModel extends Feed {
  page = 0;
  receive(value: unknown, now: number): void {
    const v = record(value);
    const consumption = requiredNumber(v.consumption_w),
      generation = requiredNumber(v.generation_w),
      daily = requiredNumber(v.daily_kwh);
    if (consumption < 0 || generation < 0 || daily < 0)
      throw new Error("Energy totals must not be negative");
    const grid =
      v.grid_w === undefined
        ? consumption - generation
        : requiredNumber(v.grid_w);
    this.commit(
      [{ consumption, generation, daily, grid }],
      now,
      v.updated_at === undefined ? now : v.updated_at,
    );
  }
  key(key: string, delta: number, _now: number): boolean {
    if (key === "wheel") this.page = cycle(this.page, delta, 3);
    return false;
  }
  power(watts: number): string {
    return Math.abs(watts) >= 1000
      ? (Math.abs(watts) / 1000).toFixed(2) + " kW"
      : Math.round(Math.abs(watts)) + " W";
  }
  view(now: number): View {
    if (!this.items.length) return this.empty("Energy Flow", now);
    const v = this.items[0];
    const grid = num(v, "grid");
    return this.feedView(
      this.page === 0
        ? "Grid " + (grid >= 0 ? "import" : "export")
        : this.page === 1
          ? "Generation"
          : "Today",
      this.page === 0
        ? this.power(grid)
        : this.page === 1
          ? this.power(num(v, "generation"))
          : num(v, "daily").toFixed(2) + " kWh",
      [
        "Load " + this.power(num(v, "consumption")),
        "Solar " + this.power(num(v, "generation")),
      ],
      now,
      grid < 0 ? "#66EE99FF" : "#FFB966FF",
    );
  }
}
