class PortaCorrederaCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("porta-corredera-card requires an entity");
    }

    this.config = {
      name: "Porta carretera",
      movement_entity: "input_select.porta_carretera_moviment",
      started_at_entity: "input_datetime.porta_carretera_moviment_inici",
      open_duration_entity: "input_number.porta_carretera_temps_obertura",
      close_duration_entity: "input_number.porta_carretera_temps_tancament",
      open_sensor: "binary_sensor.jardi_porta_carretera_obre_relay_porta_oberta",
      closed_sensor: "binary_sensor.jardi_porta_carretera_tanca_relay_porta_tancada",
      mid_position: 50,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
    this.scheduleAnimation();
  }

  disconnectedCallback() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  getCardSize() {
    return 4;
  }

  scheduleAnimation() {
    const state = this.getMovementState();
    const shouldAnimate = state === "obrint" || state === "tancant";

    if (!shouldAnimate || this.animationFrame) {
      return;
    }

    const tick = () => {
      this.animationFrame = null;
      this.render();

      if (this.getMovementState() === "obrint" || this.getMovementState() === "tancant") {
        this.animationFrame = requestAnimationFrame(tick);
      }
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  render() {
    if (!this._hass || !this.config) {
      return;
    }

    const cover = this._hass.states[this.config.entity];
    const movement = this.getMovementState();
    const progress = this.getProgress();
    const status = this.getStatusLabel(cover, movement);
    const details = this.getDetailsLabel(progress, movement);
    const stateClass = this.getStateClass(cover, movement);
    const canOpen = cover?.state !== "open" && movement !== "obrint" && movement !== "tancant";
    const canClose = cover?.state !== "closed" && movement !== "obrint" && movement !== "tancant";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --gate-accent: #18b7d8;
          --gate-accent-2: #2dd4bf;
          --gate-danger: #f97373;
          --gate-warning: #f59e0b;
        }

        ha-card {
          background:
            radial-gradient(circle at 18% 0%, rgba(45, 212, 191, 0.13), transparent 34%),
            radial-gradient(circle at 92% 8%, rgba(24, 183, 216, 0.16), transparent 28%),
            var(--ha-card-background, var(--card-background-color));
          border: 1px solid color-mix(in srgb, var(--divider-color), transparent 25%);
          border-radius: 14px;
          box-shadow: var(--ha-card-box-shadow, 0 10px 28px rgba(0, 0, 0, 0.18));
          overflow: hidden;
          padding: 20px;
        }

        .header {
          align-items: center;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .heading {
          align-items: center;
          display: flex;
          gap: 12px;
          min-width: 0;
        }

        .avatar {
          align-items: center;
          background:
            linear-gradient(145deg, rgba(45, 212, 191, 0.95), rgba(14, 165, 233, 0.95));
          border-radius: 10px;
          box-shadow: 0 8px 18px rgba(14, 165, 233, 0.25);
          color: white;
          display: flex;
          flex: 0 0 42px;
          height: 42px;
          justify-content: center;
          width: 42px;
        }

        .avatar ha-icon {
          --mdc-icon-size: 24px;
        }

        .title {
          color: var(--primary-text-color);
          font-size: 19px;
          font-weight: 700;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .subtitle {
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.4;
          margin-top: 4px;
        }

        .status {
          align-items: center;
          background: rgba(148, 163, 184, 0.14);
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          color: var(--primary-text-color);
          display: inline-flex;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          min-height: 34px;
          padding: 0 12px;
          white-space: nowrap;
        }

        .status::before {
          background: #94a3b8;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.16);
          content: "";
          height: 8px;
          width: 8px;
        }

        .status.open::before {
          background: var(--gate-accent-2);
          box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.18);
        }

        .status.closed::before {
          background: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.18);
        }

        .status.moving::before {
          animation: pulse 1.2s ease-in-out infinite;
          background: var(--gate-warning);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18);
        }

        .status.error::before {
          background: var(--gate-danger);
          box-shadow: 0 0 0 4px rgba(249, 115, 115, 0.18);
        }

        .scene {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)),
            linear-gradient(135deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.04));
          border: 1px solid color-mix(in srgb, var(--divider-color), transparent 8%);
          border-radius: 12px;
          height: 124px;
          overflow: hidden;
          position: relative;
        }

        .scene::before {
          background:
            linear-gradient(90deg, transparent 0 23px, rgba(148, 163, 184, 0.09) 23px 24px),
            linear-gradient(180deg, transparent 0 23px, rgba(148, 163, 184, 0.07) 23px 24px);
          background-size: 24px 24px;
          content: "";
          inset: 0;
          opacity: 0.55;
          position: absolute;
        }

        .rail {
          background: linear-gradient(90deg, #64748b, #cbd5e1, #64748b);
          border-radius: 999px;
          height: 5px;
          left: 22px;
          position: absolute;
          right: 22px;
          top: 26px;
        }

        .post {
          background: linear-gradient(180deg, #cbd5e1, #64748b);
          border-radius: 4px 4px 2px 2px;
          bottom: 24px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
          opacity: 0.5;
          position: absolute;
          top: 18px;
          width: 8px;
        }

        .post.left {
          left: 24px;
        }

        .post.right {
          right: 24px;
        }

        .gate {
          --open: ${progress / 100};
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 34%),
            repeating-linear-gradient(
              90deg,
              #06b6d4 0 7px,
              #0891b2 7px 10px,
              #67e8f9 10px 11px
            );
          border: 1px solid rgba(14, 116, 144, 0.9);
          border-radius: 8px;
          bottom: 32px;
          box-shadow: 0 12px 22px rgba(8, 145, 178, 0.24), 0 7px 18px rgba(0, 0, 0, 0.2);
          left: 7%;
          position: absolute;
          top: 40px;
          transform: translateX(calc(-62% * var(--open)));
          transition: transform 180ms linear;
          width: 86%;
        }

        .ground {
          background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.65), transparent);
          bottom: 24px;
          height: 3px;
          left: 20px;
          position: absolute;
          right: 20px;
        }

        .progress-row {
          align-items: center;
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr auto;
          margin-top: 14px;
        }

        .progress {
          background: rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
        }

        .progress > div {
          background: linear-gradient(90deg, var(--gate-accent-2), var(--gate-accent), #38bdf8);
          border-radius: inherit;
          box-shadow: 0 0 16px rgba(45, 212, 191, 0.35);
          height: 100%;
          transition: width 180ms linear;
          width: ${progress}%;
        }

        .percent {
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 700;
          min-width: 38px;
          text-align: right;
        }

        .controls {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr 1fr;
          margin-top: 16px;
        }

        button {
          align-items: center;
          background: color-mix(in srgb, var(--card-background-color), white 7%);
          border: 1px solid color-mix(in srgb, var(--divider-color), transparent 12%);
          border-radius: 10px;
          color: var(--primary-text-color);
          cursor: pointer;
          display: flex;
          font: inherit;
          font-size: 14px;
          font-weight: 750;
          gap: 9px;
          justify-content: center;
          min-height: 46px;
          padding: 0 14px;
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
        }

        button ha-icon {
          --mdc-icon-size: 20px;
        }

        button:hover:not(:disabled) {
          background: color-mix(in srgb, var(--primary-color), var(--card-background-color) 84%);
          border-color: color-mix(in srgb, var(--primary-color), var(--divider-color) 30%);
          transform: translateY(-1px);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.42;
        }

        .open-button {
          color: #22d3ee;
        }

        .close-button {
          color: #2dd4bf;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.55;
            transform: scale(0.9);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @media (max-width: 420px) {
          ha-card {
            padding: 14px;
          }

          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .status {
            justify-content: center;
            white-space: normal;
          }

          .controls {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="heading">
            <div class="avatar">
              <ha-icon icon="mdi:garage"></ha-icon>
            </div>
            <div>
              <div class="title">${this.escape(this.config.name)}</div>
              <div class="subtitle">${this.escape(details)}</div>
            </div>
          </div>
          <div class="status ${stateClass}">${this.escape(status)}</div>
        </div>

        <div class="scene" aria-label="${this.escape(status)}">
          <div class="rail"></div>
          <div class="post left"></div>
          <div class="post right"></div>
          <div class="gate"></div>
          <div class="ground"></div>
        </div>

        <div class="progress-row">
          <div class="progress" aria-hidden="true">
            <div></div>
          </div>
          <div class="percent">${progress}%</div>
        </div>

        <div class="controls">
          <button class="open-button" id="openButton" ${canOpen ? "" : "disabled"}>
            <ha-icon icon="mdi:gate-open"></ha-icon>
            <span>Obrir</span>
          </button>
          <button class="close-button" id="closeButton" ${canClose ? "" : "disabled"}>
            <ha-icon icon="mdi:gate"></ha-icon>
            <span>Tancar</span>
          </button>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById("openButton")?.addEventListener("click", () => {
      this._hass.callService("cover", "open_cover", { entity_id: this.config.entity });
    });

    this.shadowRoot.getElementById("closeButton")?.addEventListener("click", () => {
      this._hass.callService("cover", "close_cover", { entity_id: this.config.entity });
    });
  }

  getMovementState() {
    return this._hass?.states[this.config.movement_entity]?.state ?? "unknown";
  }

  getProgress() {
    const states = this._hass.states;
    const cover = states[this.config.entity];
    const movement = this.getMovementState();
    const openSensor = states[this.config.open_sensor]?.state;
    const closedSensor = states[this.config.closed_sensor]?.state;

    if (openSensor === "on" || cover?.state === "open") {
      return 100;
    }

    if (closedSensor === "on" || cover?.state === "closed") {
      return 0;
    }

    if (movement !== "obrint" && movement !== "tancant") {
      return this.clamp(Number(this.config.mid_position), 0, 100);
    }

    const startedAt = this.parseDate(states[this.config.started_at_entity]?.state);
    const durationEntity = movement === "obrint"
      ? this.config.open_duration_entity
      : this.config.close_duration_entity;
    const durationSeconds = Number(states[durationEntity]?.state) || 18;

    if (!startedAt) {
      return movement === "obrint" ? 5 : 95;
    }

    const elapsedSeconds = Math.max(0, (Date.now() - startedAt.getTime()) / 1000);
    const ratio = this.clamp(elapsedSeconds / durationSeconds, 0, 1);
    const progress = movement === "obrint" ? ratio * 100 : 100 - ratio * 100;

    return Math.round(this.clamp(progress, 0, 100));
  }

  getStatusLabel(cover, movement) {
    if (movement === "error") {
      return "Revisar estat";
    }

    if (movement === "obrint" || cover?.state === "opening") {
      return "Obrint";
    }

    if (movement === "tancant" || cover?.state === "closing") {
      return "Tancant";
    }

    if (cover?.state === "open") {
      return "Oberta";
    }

    if (cover?.state === "closed") {
      return "Tancada";
    }

    return "Posicio intermitja";
  }

  getStateClass(cover, movement) {
    if (movement === "error") {
      return "error";
    }

    if (movement === "obrint" || movement === "tancant" || cover?.state === "opening" || cover?.state === "closing") {
      return "moving";
    }

    if (cover?.state === "open") {
      return "open";
    }

    if (cover?.state === "closed") {
      return "closed";
    }

    return "unknown";
  }

  getDetailsLabel(progress, movement) {
    if (movement === "error") {
      return "Cap final de carrera actiu quan ha acabat el temps estimat";
    }

    if (movement === "obrint" || movement === "tancant") {
      return `${progress}% estimat`;
    }

    return "Control de porta corredera";
  }

  parseDate(value) {
    if (!value || value === "unknown" || value === "unavailable") {
      return null;
    }

    const parsed = new Date(value.replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

customElements.define("porta-corredera-card", PortaCorrederaCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "porta-corredera-card",
  name: "Porta Corredera Card",
  description: "Targeta visual per controlar una porta corredera com a cover.",
});
