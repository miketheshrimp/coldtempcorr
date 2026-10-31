# Cold Altitude Correction

## 中文简介

这是一个可离线使用的低温高度修正与进近下降剖面计算工具，面向飞行员和飞行计划使用。输入机场温度、机场标高、地速以及程序各点的发布高度后，工具会根据 FAA/ICAO 低温修正表计算应加的高度修正，并比较 FAF 至 MAP 之间标准 3 度下降剖面与低温条件下实际几何下降剖面的差异。

工具仅供飞行计划和学习参考，不能替代正式航图、法规、运行人程序、机组判断或空中交通管制指令。

An offline-capable web calculator for cold-temperature altitude corrections and final-approach descent-path analysis.

**Live apps:** [rack.228311.xyz:49173](https://rack.228311.xyz:49173/) · [tool.228311.xyz:49173](https://tool.228311.xyz:49173/)

The app is designed for pilots and flight-planning discussions. It calculates corrections for selected procedure altitudes, then compares a nominal 5.2% (approximately 3°) FAF-to-MAP profile with the shallower geometric path that results when uncompensated barometric altitudes are flown in cold air.

> [!CAUTION]
> This is a planning and educational tool, not approved navigation equipment. Always follow the current procedure, applicable authority guidance, aircraft and operator limitations, chart notes, and ATC instructions. Independently verify every operational value before use.

## Features

- Interpolates the FAA-published ICAO Cold Temperature Error Table.
- Accepts airport temperatures from 0°C to −50°C. Enter the absolute number; the app adds the minus sign automatically for below-zero values.
- Calculates the correction and resulting indicated altitude for any active procedure row.
- Starts with common labels including IAF, IF, FAF, MAP / DDA / MDA / DA, missed-approach altitude, holding altitude, and MSA.
- Automatically activates a row when an altitude is entered and excludes it completely when the value is cleared.
- Supports adding, deleting, renaming, and drag-reordering altitude rows.
- Uses active rows labeled `FAF` and `MAP` to calculate the final-segment comparison.
- Displays the standard vertical speed, cold geometric descent rate, estimated cold cockpit VSI indication, and indicated rate for the same physical 5.2% path.
- Includes a day/night theme and a responsive layout for iPhone Safari.
- Works without an internet connection after one successful online load.
- Can print the results or save them as a PDF through the browser.

## Using the calculator

1. Open either [rack.228311.xyz:49173](https://rack.228311.xyz:49173/) or [tool.228311.xyz:49173](https://tool.228311.xyz:49173/) while connected to the internet at least once.
2. Enter the positive magnitude of the below-zero airport temperature. For example, enter `18` for −18°C.
3. Enter the airport elevation in feet MSL.
4. Enter the expected FAF-to-MAP groundspeed in knots.
5. Enter the published procedure altitudes you need. A row switches on when it contains an altitude and switches off when cleared.
6. Ensure one active row is labeled `FAF` and another contains `MAP` or `Missed approach point`.
7. Select **Calculate corrections**.

The altitude table shows the published altitude, height above airport elevation, correction to add, and corrected indicated altitude to fly.

## Calculation overview

Altitude corrections are obtained by bilinear interpolation across temperature and height in the FAA/ICAO cold-temperature correction table. Heights below 200 ft are scaled from the first table row. Values above 5,000 ft above airport elevation use a linear extension of the final table interval and are identified in the result note.

For final-segment analysis, the app:

1. Finds the active FAF and MAP rows.
2. Uses their published altitude difference and a 5.2% gradient to derive the nominal horizontal distance.
3. Applies the cold-temperature error at each end of the segment.
4. Compares the resulting true-height difference with the nominal profile.
5. Uses groundspeed to calculate standard and cold geometric vertical rates.
6. Converts geometric vertical speed back to an estimated pressure-derived VSI indication using the table-derived FAF-to-MAP layer-thickness ratio.

The VSI value is an estimate. Actual indication can vary with the atmospheric temperature and virtual-temperature profile, pressure structure, static-system and air-data-computer calibration, and instrument lag.

## Offline use and installation

The site is a progressive web app. After the service worker finishes caching the app files, it can reopen without an internet connection.

On iPhone or iPad, open the site in Safari, tap **Share**, and select **Add to Home Screen**. Load the site online once before relying on its offline copy.

If a new release appears unchanged, reconnect to the internet, reload the page, and reopen it so the latest cached version can activate.

## Run locally

No build step or package installation is required. The application is plain HTML, CSS, and JavaScript in `dist/`.

From the repository folder, start any static file server. For example:

```sh
python3 -m http.server 4173 --directory dist
```

Then open <http://127.0.0.1:4173/>.

Opening `index.html` directly is not recommended because browsers require an HTTP or HTTPS origin for service workers and offline caching.

## Project structure

```text
dist/
  index.html             Page structure and explanatory text
  styles.css             Responsive day/night presentation
  app.js                 Correction, profile, VSI, chart, and UI logic
  sw.js                  Offline cache service worker
  manifest.webmanifest   Installable web-app metadata
  icon.svg               Application icon
deploy/
  nginx-rack.conf        Example production web-server configuration
  cold-altitude-app.service
  reload-nginx.sh
```

## Contributing

Pilot testing is especially valuable. Please use a [GitHub issue](https://github.com/miketheshrimp/coldtempcorr/issues) for calculation discrepancies, operational usability problems, or feature ideas.

For a calculation report, include:

- the governing authority or published reference;
- airport temperature and elevation;
- groundspeed;
- every active procedure label and published altitude;
- the result you expected and the result shown;
- browser and device;
- a screenshot with any sensitive information removed.

To contribute code:

1. Fork the repository.
2. Create a focused branch for the change.
3. Test it on both desktop and a narrow mobile viewport. Safari testing is strongly encouraged.
4. Confirm the app loads offline after one online visit.
5. Open a pull request explaining the aviation basis, user-visible behavior, and tests performed.

Keep calculation changes separate from visual changes when practical. Any modification to formulas, tables, units, limits, or operational wording should cite an authoritative source and include reproducible test cases.

## Authoritative references

- [FAA Aeronautical Information Manual — Altimeter Errors](https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_3.html)
- [FAA Aviation Maintenance Technician Handbook—Airframe, Volume 2](https://www.faa.gov/sites/faa.gov/files/2022-06/amt_airframe_hb_vol_2.pdf) — pressure-operated vertical speed indicator background

## License

This project is released under the [MIT License](LICENSE). The license permits reuse, modification, and redistribution provided the copyright and license notices are retained.

The calculator is provided for planning and educational use only. The MIT License does not replace the operational limitations and safety warnings in this README.
