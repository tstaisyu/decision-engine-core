# Flow

```text
sensor
  ↓
adapters/temperature_input_adapter
  ↓
evaluate(input, config)
  ↓
result.action
  ↓
adapters/fan_output_adapter
  ↓
PWM / fan control
```
