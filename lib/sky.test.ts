import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moonOn, moonPhaseName, moonPctOn, SYNODIC_DAYS, tonight } from "./sky";

describe("moonPhaseName", () => {
  it("does not call a ~39% waxing moon First Quarter", () => {
    // Homepage bug: 38.7% / ~77° was labeled First Quarter under wide angle buckets.
    const p = moonPhaseName(38.67, 76.75);
    assert.equal(p.name, "Waxing Crescent");
    assert.equal(p.emoji, "🌒");
  });

  it("reserves First Quarter for ~45–55% lit or within about a day of the quarter by age", () => {
    assert.equal(moonPhaseName(50, 90).name, "First Quarter");
    assert.equal(moonPhaseName(45, 85).name, "First Quarter");
    assert.equal(moonPhaseName(55, 95).name, "First Quarter");
    // 44% is outside the illumination band, but age is within a day of first quarter.
    const almostQ = (SYNODIC_DAYS / 4 - 0.5) / SYNODIC_DAYS * 360;
    assert.equal(moonPhaseName(44, almostQ).name, "First Quarter");
    // 39% and more than a day before first quarter stays waxing crescent.
    const earlier = (SYNODIC_DAYS / 4 - 1.08) / SYNODIC_DAYS * 360;
    assert.equal(moonPhaseName(39, earlier).name, "Waxing Crescent");
  });

  it("applies the same quarter rule on the waning side", () => {
    assert.equal(moonPhaseName(50, 270).name, "Last Quarter");
    assert.equal(moonPhaseName(45, 265).name, "Last Quarter");
    assert.equal(moonPhaseName(39, 283.25).name, "Waning Crescent");
  });

  it("names the other major phases", () => {
    assert.equal(moonPhaseName(0, 0).name, "New Moon");
    assert.equal(moonPhaseName(100, 180).name, "Full Moon");
    assert.equal(moonPhaseName(75, 120).name, "Waxing Gibbous");
    assert.equal(moonPhaseName(75, 240).name, "Waning Gibbous");
    assert.equal(moonPhaseName(20, 50).name, "Waxing Crescent");
    assert.equal(moonPhaseName(20, 310).name, "Waning Crescent");
    assert.equal(moonPhaseName(1, 359).name, "New Moon");
  });
});

describe("moonOn / tonight", () => {
  it("labels the 2026-11-15 39%-lit moon Waxing Crescent, matching the Leonids copy's old claim for that moon", () => {
    const m = moonOn("2026-11-15");
    assert.equal(m.illumination, 39);
    assert.equal(m.phase, "Waxing Crescent");
  });

  it("labels the Leonids peak night of 2026-11-16 First Quarter (~48% lit)", () => {
    const m = moonOn("2026-11-16");
    assert.equal(m.illumination, 48);
    assert.equal(m.phase, "First Quarter");
    assert.equal(moonPctOn("2026-11-16"), 48);
  });

  it("uses the same function for tonight() on the 39%-lit Nov 15 moon", () => {
    const t = tonight(new Date("2026-11-15T21:00:00-10:00"));
    assert.equal(t.date, "2026-11-15");
    assert.equal(t.illumination, 39);
    assert.equal(t.phase, "Waxing Crescent");
  });
});
