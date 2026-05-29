# Flow

```text
Si7021 temperature input
  ↓
adapters/temperature_input_adapter
  ↓
evaluate(input, config)
  ↓
result.action
  ↓
adapters/fan_output_adapter
  ↓
PWM output
  ↓
LED verification
```

Current status:

- verified: PWM LED output
- not yet verified: real fan output
