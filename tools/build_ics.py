#!/usr/bin/env python3
"""Erzeugt aus termine.txt die Kalenderdateien:
   termine.ics          -> alle Termine (zum Abonnieren)
   ics/<slug>.ics       -> je Termin eine Datei (Speichern-Button)
Wird bei jedem Push automatisch von GitHub ausgeführt."""
import re, sys, datetime as dt, pathlib

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
TZ = "Europe/Vienna"
VTIMEZONE = """BEGIN:VTIMEZONE
TZID:Europe/Vienna
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE"""

def slug(date, title):  # muss identisch zu slug() in assets/app.js sein
    t = title.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        t = t.replace(a, b)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:40].strip("-")
    return date.strftime("%Y%m%d") + "-" + t

def esc(s):
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")

def fold(line):  # RFC 5545: Zeilen max. 75 Bytes
    out, b = [], line.encode()
    while len(b) > 75:
        cut = 75 if not out else 74
        while (b[cut] & 0xC0) == 0x80:
            cut -= 1
        out.append(b[:cut].decode()); b = b[cut:]
    out.append(b.decode())
    return "\r\n ".join(out)

def parse(text):
    events = []
    for n, line in enumerate(text.splitlines(), 1):
        l = line.strip()
        if not l or l.startswith("#"):
            continue
        f = [x.strip() for x in l.split("|")] + [""] * 5
        m = re.fullmatch(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", f[0])
        if not m:
            print(f"termine.txt Zeile {n}: Datum unlesbar: {l}", file=sys.stderr); continue
        d = dt.date(int(m[3]), int(m[2]), int(m[1]))
        tm = re.fullmatch(r"(\d{1,2}):(\d{2})", f[1])
        title = f[2].lstrip("*").strip() or "Termin"
        events.append(dict(date=d, time=dt.time(int(tm[1]), int(tm[2])) if tm else None,
                           title=title, place=f[3], info=f[4]))
    return events

def vevent(e, stamp):
    d, t = e["date"], e["time"]
    if t:
        start = dt.datetime.combine(d, t); end = start + dt.timedelta(hours=3)
        when = [f"DTSTART;TZID={TZ}:{start:%Y%m%dT%H%M%S}", f"DTEND;TZID={TZ}:{end:%Y%m%dT%H%M%S}"]
    else:
        when = [f"DTSTART;VALUE=DATE:{d:%Y%m%d}", f"DTEND;VALUE=DATE:{d + dt.timedelta(days=1):%Y%m%d}"]
    lines = ["BEGIN:VEVENT", f"UID:{slug(d, e['title'])}@dschinnis.fun", f"DTSTAMP:{stamp}", *when,
             f"SUMMARY:{esc(e['title'])}"]
    if e["place"]: lines.append(f"LOCATION:{esc(e['place'])}")
    if e["info"]: lines.append(f"DESCRIPTION:{esc(e['info'])}")
    lines += ["URL:https://dschinnis.fun/#termine", "END:VEVENT"]
    return lines

def calendar(events, stamp, name=None):
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bregenzer Dschinnis//Termine//DE",
             "CALSCALE:GREGORIAN", "METHOD:PUBLISH"]
    if name:
        lines += [f"X-WR-CALNAME:{name}", f"X-WR-TIMEZONE:{TZ}", "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
                  "X-PUBLISHED-TTL:PT12H"]
    lines.append(VTIMEZONE.replace("\n", "\r\n"))
    for e in events:
        lines += vevent(e, stamp)
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) if "\r\n" not in l else l for l in lines) + "\r\n"

def main():
    events = parse((ROOT / "termine.txt").read_text(encoding="utf-8"))
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (ROOT / "termine.ics").write_text(calendar(events, stamp, "Bregenzer Dschinnis"), encoding="utf-8", newline="")
    out = ROOT / "ics"; out.mkdir(exist_ok=True)
    for f in out.glob("*.ics"):
        f.unlink()
    for e in events:
        (out / f"{slug(e['date'], e['title'])}.ics").write_text(calendar([e], stamp), encoding="utf-8", newline="")
    print(f"{len(events)} Termine -> termine.ics + ics/")

if __name__ == "__main__":
    main()
