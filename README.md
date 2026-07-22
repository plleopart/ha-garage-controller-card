# Porta Corredera Card

Custom Lovelace dashboard card for Home Assistant that controls and visualizes
a sliding gate exposed as `cover.porta_carretera`.

## Required Home Assistant Package

Install the Home Assistant package first:

```text
ha-config/packages/porta_carretera.yaml
```

That package creates the `cover`, scripts, helpers and timer used by this card.
The card only renders those entities and calls the standard `cover.open_cover`
and `cover.close_cover` services.

## Installation With HACS

1. Go to **HACS > Dashboard**.
2. Open **Custom repositories**.
3. Add this repository:

```text
https://github.com/plleopart/ha-garage-controller-card
```

4. Select category **Dashboard**.
5. Install **Porta Corredera Card**.
6. Add the resource if HACS does not do it automatically:

```yaml
url: /hacsfiles/ha-garage-controller-card/porta-corredera-card.js
type: module
```

## Basic Usage

```yaml
type: custom:porta-corredera-card
entity: cover.porta_carretera
name: Porta carretera
movement_entity: input_select.porta_carretera_moviment
started_at_entity: input_datetime.porta_carretera_moviment_inici
open_duration_entity: input_number.porta_carretera_temps_obertura
close_duration_entity: input_number.porta_carretera_temps_tancament
open_sensor: binary_sensor.jardi_porta_carretera_obre_relay_porta_oberta
closed_sensor: binary_sensor.jardi_porta_carretera_tanca_relay_porta_tancada
mid_position: 50
```

## Options

| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `entity` | yes | none | Cover entity for the gate. |
| `name` | no | `Porta carretera` | Card title. |
| `movement_entity` | no | `input_select.porta_carretera_moviment` | Helper with `aturada`, `obrint`, `tancant` or `error`. |
| `started_at_entity` | no | `input_datetime.porta_carretera_moviment_inici` | Movement start time. |
| `open_duration_entity` | no | `input_number.porta_carretera_temps_obertura` | Estimated opening duration in seconds. |
| `close_duration_entity` | no | `input_number.porta_carretera_temps_tancament` | Estimated closing duration in seconds. |
| `open_sensor` | no | `binary_sensor.jardi_porta_carretera_obre_relay_porta_oberta` | End sensor for fully open state. |
| `closed_sensor` | no | `binary_sensor.jardi_porta_carretera_tanca_relay_porta_tancada` | End sensor for fully closed state. |
| `mid_position` | no | `50` | Visual position when the gate is neither open nor closed and not moving. |

## Development

During development, the card can be served from Home Assistant's `/config/www`
directory:

```text
/config/www/ha-garage-controller-card/porta-corredera-card.js
```

Resource URL:

```yaml
url: /local/ha-garage-controller-card/porta-corredera-card.js
type: module
```

When testing local changes, clear the browser cache or add a query string:

```yaml
url: /local/ha-garage-controller-card/porta-corredera-card.js?v=dev1
type: module
```
