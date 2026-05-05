# Flow

```text
sensor
  ↓
temperature-input-adapter
  ↓
evaluate(input, config)
  ↓
result.action
  ↓
fan-action-adapter
  ↓
PWM / fan control
```
