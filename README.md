# Temperature & Descent Calculator — 温度与下降计算器

**Version 1.1 · Live apps:** [rack.228311.xyz:49173](https://rack.228311.xyz:49173/) · [tool.228311.xyz:49173](https://tool.228311.xyz:49173/)

> [!CAUTION]
> This is a planning and educational tool, not approved navigation equipment. Always follow the current procedure, applicable authority guidance, aircraft and operator limitations, chart notes, and ATC instructions. Independently verify every operational value before use.
>
> 本工具仅供飞行计划和学习参考，不能替代正式航图、法规、运行人程序、机组判断或空中交通管制指令。使用前请独立核实每一个运行数值。

The app has two modes, switched at the top of the page: **Cold correction** (低温修正) and **Hot VSI** (高温垂直速度). It is a pure static web app — no backend, no database, no API key — and it works offline after one successful online load.

本工具顶部有两个模式切换：**Cold correction（低温修正）**和 **Hot VSI（高温垂直速度）**。它是一个纯静态网页应用，无后端、无数据库、无需 API 密钥，首次联网加载成功后即可离线使用。

---

## 中文

### 简介

- **低温模式**：输入机场温度、机场标高、地速和程序各点的发布高度，按 FAA/ICAO 低温修正表计算应加的高度修正，并比较 FAF 至 DA/MDA 之间标准 5.2%（约 3°）下降剖面与低温条件下实际几何下降剖面的差异。
- **高温模式**：不做高度修正。输入外界气温、机场标高、当地 QNH、指示空速、顶风分量和下滑角，输出在几何下滑道和无气压式垂直导航（baro-VNAV）的 FMC 下滑道上各自的指示垂直速度，并给出地速、真空速、真下降率和真下滑角。
- 两个模式都有 **Load example（加载示例）**和 **Clear data（清除数据）**：清除后可立即开始下一次计算，低温页恢复为空的初始高度行，高温页将 QNH 恢复为 1013 hPa、下滑角恢复为 3.0°。

### 低温模式：功能与使用

必填项以琥珀色框标出：机场温度、机场标高、地速，以及一行 FAF 和一行 DA/MDA。DA/MDA 行也接受旧标签 MAP 或 “Missed approach point”。

1. 输入机场温度的绝对值，例如 −18°C 输入 `18`，工具会自动加上负号。温度范围 0°C 至 −50°C。
2. 输入机场标高（英尺 MSL，−1,500 至 15,000 英尺）。
3. 输入 FAF 至 DA/MDA 的地速（节）。
4. 输入程序各点的发布高度。初始行包括 IAF、IF、FAF、Step-down Fix、DA/MDA、GA ALT、Holding、MSA；可添加、删除、改名和拖动排序。输入高度即激活该点，清空即完全排除该点。
5. 选择 **Calculate corrections**。

结果包括每一点的机场上高、修正量和应飞的修正指示高度，以及最后航段的标准垂直速度、低温几何下降率和座舱 VSI 指示估计值，并附下降剖面图。

### 高温模式：功能与使用

输入范围：OAT 0–50°C；机场标高 −1,500 至 15,000 英尺；QNH 900–1,100 hPa（默认 1013）；IAS 1–600 节；顶风分量 −200 至 200 节（正为顶风，负为顺风）；下滑角 0.5–6°（默认 3.0°，以 0.1° 为步长）。

1. 输入 OAT、机场标高、QNH、IAS、顶风分量和下滑角。
2. 选择 **Calculate**。地速是输出，不是输入。

示例（与应用内示例一致）：OAT 35°C、机场标高 5,000 英尺、IAS 140 节、顶风 10 节、QNH 1013 hPa、下滑角 3.0°，得到 TAS 159 节、地速 149 节、标称下降率 789 英尺/分钟；几何下滑道指示垂直速度 713 英尺/分钟；FMC 下滑道指示垂直速度 789 英尺/分钟、真下降率 874 英尺/分钟、真下滑角 3.32°。

### 计算说明（中文）

**低温**：高度修正通过 FAA/ICAO 低温修正表双线性插值得到。低于 200 英尺的高度按首行比例折算；高于机场标高 5,000 英尺的部分按最后一区间线性外推（FAA 允许的可选外推方法），并在计算说明中标明。最后航段用 FAF 与 DA/MDA 的发布高度差和 5.2% 梯度推导标称水平距离，再用两端的低温误差比较标称剖面与真实高度差；VSI 指示估计用同一表格得到的 FAF–DA/MDA 层厚比把几何垂直速度换算回气压垂直速度。

**高温**：机场 ISA 温度 = 15 − 1.98 × 标高（千英尺）°C；温度比 = (OAT + 273.15) / (机场 ISA + 273.15)。站压比 = (QNH / 1013.25) × ISA 气压公式在该标高的比值；密度比 = 站压比 × (288.15 / (OAT + 273.15))；TAS = IAS / √密度比；地速 = TAS − 顶风分量；标称垂直速度 = 地速 × tan(下滑角)。几何下滑道：指示垂直速度 = 标称值 / 温度比。无 baro-VNAV 的 FMC 下滑道：指示垂直速度按定义就是标称值（因为该下滑道在气压高度上就是输入的角度），真下降率 = 标称值 × 温度比，真下滑角 = atan(tan(下滑角) × 温度比)。TAS 采用低速密度近似，忽略压缩性和仪表/位置误差，仅为计划估算；VSI 指示还受真实温度廓线、静压系统和 ADC 校准、仪表滞后影响。高温页不做高度修正——热空气中真高高于指示高度，温度不会减小障碍物余度。

### 离线、更新与手机版式

- 首次联网加载成功后，Service Worker 会缓存应用文件，之后可离线打开。在 iPhone/iPad 上用 Safari 打开网站，点分享后选择“添加到主屏幕”，先联网加载一次再离线使用。
- 日/夜切换按钮右侧的 ↻ 按钮就是 **Update（更新）按钮**：点它会检查新的 Service Worker，有新版本时激活并重新加载到新版本；已是最新时显示 Up to date，不清除缓存、不重新加载；离线时提示需要联网，不会破坏离线副本。`sw.js` 本身始终以 no-cache 方式提供，避免新版本被旧缓存挡住。
- 手机上不再是上下分屏：整个页面按正常顺序向下滚动，第 1、2 节（条件与程序高度）完整显示在上部，第 3 节结果在下方，滚动页面即可看到，无需在输入面板内上下滚动。

### 本地运行

无需构建步骤或安装依赖，应用就是 `dist/` 中的纯 HTML、CSS 和 JavaScript。

```sh
python3 -m http.server 4173 --directory dist
```

然后打开 <http://127.0.0.1:4173/>。不建议直接双击打开 `index.html`，因为浏览器要求 HTTP/HTTPS 来源才能使用 Service Worker 和离线缓存。

---

## English

### Overview

- **Cold correction:** enter airport temperature, airport elevation, groundspeed, and published procedure altitudes. The app interpolates the FAA/ICAO cold-temperature error table, gives the correction and corrected indicated altitude for each active point, and compares a nominal 5.2% (approximately 3°) FAF-to-DA/MDA profile with the shallower geometric path that results when uncompensated barometric altitudes are flown in cold air.
- **Hot VSI:** no altitude correction is applied. Enter OAT, airport elevation, local QNH, IAS, headwind component, and glide slope angle. The app outputs the indicated vertical speed on a geometrical glide path and on the FMC-calculated path without baro-VNAV, plus groundspeed, TAS, true rate, and true angle.
- Both pages have **Load example** and **Clear data**: clearing starts a fresh calculation immediately — the Cold page resets to empty initial altitude rows, the Hot page resets QNH to 1013 hPa and the angle to 3.0°.

### Cold mode: features and use

Mandatory inputs are marked with an amber ring: airport temperature, airport elevation, groundspeed, plus one FAF row and one DA/MDA row. The DA/MDA row also accepts the older labels MAP or “Missed approach point”.

1. Enter the positive magnitude of the below-zero airport temperature. For example, enter `18` for −18°C; the app adds the minus sign automatically. Range 0°C to −50°C.
2. Enter airport elevation in feet MSL (−1,500 to 15,000 ft).
3. Enter the expected FAF-to-DA/MDA groundspeed in knots.
4. Enter published procedure altitudes. Initial rows are IAF, IF, FAF, Step-down Fix, DA/MDA, GA ALT, Holding, and MSA; rows can be added, deleted, renamed, and drag-reordered. A row switches on when it contains an altitude and switches off completely when cleared.
5. Select **Calculate corrections**.

Results show, for each active point, height above airport elevation, correction to add, and corrected indicated altitude to fly, plus the final-segment standard vertical speed, cold geometric descent rate, estimated cold cockpit VSI indication, and a descent-profile chart.

### Hot mode: features and use

Input ranges: OAT 0–50°C; airport elevation −1,500 to 15,000 ft; QNH 900–1,100 hPa (default 1013); IAS 1–600 kt; headwind component −200 to 200 kt (positive = headwind, negative = tailwind); glide slope angle 0.5–6° (default 3.0°, in 0.1° steps).

1. Enter OAT, airport elevation, QNH, IAS, headwind component, and glide slope angle.
2. Select **Calculate**. Groundspeed is an output, not an input.

Worked example (the app's built-in example): OAT 35°C, elevation 5,000 ft, IAS 140 kt, headwind 10 kt, QNH 1013 hPa, angle 3.0° gives TAS 159 kt, groundspeed 149 kt, nominal rate 789 fpm; geometrical-path indicated VSI 713 fpm; FMC-path indicated VSI 789 fpm, true rate 874 fpm, true angle 3.32°.

### Calculation notes (English)

**Cold:** altitude corrections are obtained by bilinear interpolation across temperature and height in the FAA/ICAO cold-temperature correction table. Heights below 200 ft are scaled from the first table row. Values above 5,000 ft above airport elevation use a linear extension of the final table interval and are identified in the result note. For final-segment analysis, the app finds the active FAF and DA/MDA rows, uses their published altitude difference and a 5.2% gradient to derive the nominal horizontal distance, applies the cold-temperature error at each end of the segment, and compares the resulting true-height difference with the nominal profile. The VSI value converts geometric vertical speed back to an estimated pressure-derived VSI indication using the table-derived FAF–DA/MDA layer-thickness ratio.

**Hot:** ISA temperature at the airport = 15 − 1.98 × elevation/1000 °C; temperature ratio = (OAT + 273.15) / (ISA at airport + 273.15). Station pressure ratio = (QNH / 1013.25) × the ISA pressure ratio at that elevation; density ratio = station pressure ratio × (288.15 / (OAT + 273.15)); TAS = IAS / √density ratio; groundspeed = TAS − headwind component; nominal VS = groundspeed × tan(glide slope angle). Geometrical path: indicated VS = nominal / ratio. FMC path without baro-VNAV: indicated VS = nominal, because the FMC path is at the entered angle in barometric altitude by definition; its true rate = nominal × ratio, and its true angle = atan(tan(angle) × ratio). TAS uses a low-speed density approximation, ignoring compressibility and instrument/position error, so it is a planning estimate, not a flight-manual value; VSI indication also depends on the real temperature profile through the layer, static-system and ADC calibration, and instrument lag. No altitude correction is applied on the Hot page — in hot air true altitude is higher than indicated, so obstacle clearance is not reduced by temperature.

### Offline use, updates, and phone layout

- The site is a progressive web app. After the service worker finishes caching the app files, it can reopen without an internet connection. On iPhone or iPad, open the site in Safari, tap **Share**, and select **Add to Home Screen**. Load the site online once before relying on its offline copy.
- The ↻ button to the right of the Day/Night toggle is the **Update button**: tap it to check for a new service worker. If one exists it is activated and the page reloads to the new version; if already up to date it says “Up to date” and does not clear caches or reload; if offline it warns that an update needs internet and leaves the offline copy untouched. `sw.js` itself is always served with `no-cache`, so a new release is not hidden behind an old cache.
- On phones the page is no longer a split screen. It flows as one document: Sections 1 and 2 (conditions and procedure altitudes) show in full at the top, and Section 3 (results) sits below them — scroll the page down to see it, with no scrolling inside the input panel.

### Run locally

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
  nginx-rack.conf        Production web-server configuration (author's own deployment)
  cold-altitude-app.service
  reload-nginx.sh
```

A generic version of the nginx config, for deploying on a friend's own VPS with their own domain and certificates, lives on the `friend-deploy` branch as `deploy/nginx-generic.conf`; it is not on `main` and is not used by the author's deployment.

## Contributing

Pilot testing is especially valuable. Please use a [GitHub issue](https://github.com/miketheshrimp/coldtempcorr/issues) for calculation discrepancies, operational usability problems, or feature ideas.

For a calculation report, include:

- the governing authority or published reference;
- airport temperature and elevation;
- groundspeed (Cold) or OAT, QNH, IAS, headwind component, and glide slope angle (Hot);
- every active procedure label and published altitude (Cold);
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

This project is released under the [MIT License](LICENSE). The license permits reuse, modification, and redistribution provided copyright and license notices are retained.

The calculator is provided for planning and educational use only. The MIT License does not replace the operational limitations and safety warnings in this README.
