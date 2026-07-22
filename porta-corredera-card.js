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
    const canOpen = cover?.state !== "open" && movement !== "obrint" && movement !== "tancant";
    const canClose = cover?.state !== "closed" && movement !== "obrint" && movement !== "tancant";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          overflow: hidden;
          padding: 18px;
        }

        .header {
          align-items: start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .title {
          color: var(--primary-text-color);
          font-size: 20px;
          font-weight: 650;
          line-height: 1.2;
        }

        .subtitle {
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.4;
          margin-top: 4px;
        }

        .status {
          align-items: center;
          background: var(--secondary-background-color);
          border-radius: 8px;
          color: var(--primary-text-color);
          display: inline-flex;
          font-size: 13px;
          font-weight: 600;
          min-height: 32px;
          padding: 0 10px;
          white-space: nowrap;
        }

        .scene {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0)),
            var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          height: 118px;
          overflow: hidden;
          position: relative;
        }

        .rail {
          background: var(--divider-color);
          height: 4px;
          left: 16px;
          position: absolute;
          right: 16px;
          top: 26px;
        }

        .post {
          background: var(--secondary-text-color);
          bottom: 22px;
          opacity: 0.5;
          position: absolute;
          top: 18px;
          width: 8px;
        }

        .post.left {
          left: 18px;
        }

        .post.right {
          right: 18px;
        }

        .gate {
          --open: ${progress / 100};
          background:
            repeating-linear-gradient(
              90deg,
              var(--primary-color) 0 7px,
              color-mix(in srgb, var(--primary-color), var(--card-background-color) 30%) 7px 11px
            );
          border: 1px solid color-mix(in srgb, var(--primary-color), black 20%);
          border-radius: 6px;
          bottom: 26px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.16);
          left: calc(22px + (100% - 74px) * var(--open));
          position: absolute;
          top: 36px;
          transform: translateX(calc(-100% * var(--open)));
          transition: left 180ms linear, transform 180ms linear;
          width: calc(100% - 64px);
        }

        .ground {
          background: var(--divider-color);
          bottom: 22px;
          height: 4px;
          left: 16px;
          position: absolute;
          right: 16px;
        }

        .progress {
          background: var(--secondary-background-color);
          border-radius: 999px;
          height: 8px;
          margin-top: 14px;
          overflow: hidden;
        }

        .progress > div {
          background: var(--primary-color);
          height: 100%;
          transition: width 180ms linear;
          width: ${progress}%;
        }

        .controls {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr 1fr;
          margin-top: 16px;
        }

        mwc-button {
          --mdc-theme-primary: var(--primary-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          min-height: 42px;
        }

        mwc-button[disabled] {
          opacity: 0.45;
        }

        @media (max-width: 420px) {
          ha-card {
            padding: 14px;
          }

          .header {
            flex-direction: column;
          }

          .status {
            white-space: normal;
          }
        }
      </style>

      <ha-card>
        <div class="header">
          <div>
            <div class="title">${this.escape(this.config.name)}</div>
            <div class="subtitle">${this.escape(details)}</div>
          </div>
          <div class="status">${this.escape(status)}</div>
        </div>

        <div class="scene" aria-label="${this.escape(status)}">
          <div class="rail"></div>
          <div class="post left"></div>
          <div class="post right"></div>
          <div class="gate"></div>
          <div class="ground"></div>
        </div>

        <div class="progress" aria-hidden="true">
          <div></div>
        </div>

        <div class="controls">
          <mwc-button raised ?disabled=${!canOpen} id="openButton">Obrir</mwc-button>
          <mwc-button raised ?disabled=${!canClose} id="closeButton">Tancar</mwc-button>
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
