# Flow

All integration templates and automations are internally represented as flows. A flow consists of an orchestrated pattern of business activity enabled by interconnecting components together that transform input data (coming from trigger-type of components), perform actions, store data and/or load data to external systems.

![Flow](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-L_wX6vC3ERnOFpc31W4%2F-L_wYg_3yos4MYamt4h9%2FScreenshot%202019-03-14%20at%2015.15.16.png?alt=media\&token=990241f6-5a72-42d8-bf88-ea2a59507266)

Appmixer provides an interpreter for running flows and UI to manage flows.

## Flow Descriptor

Flows are represented as JSON objects in the Appmixer engine. The JSON object is called "flow descriptor" in the Appmixer jargon and for the example image above, it may look like this:

```
{
    "76a77abf-d5ec-4b1c-b6e8-031359a6a640": {
        "type": "appmixer.utils.timers.Timer",
        "label": "Timer",
        "x": 265,
        "y": 115,
        "config": {
            "properties": {
                "interval": 15
            }
        }
    },
    "a0828f32-34b8-4c8d-b6b3-1d82ca305921": {
        "type": "appmixer.utils.weather.GetCurrentWeather",
        "label": "GetCurrentWeather",
        "source": {
            "location": {
                "76a77abf-d5ec-4b1c-b6e8-031359a6a640": [
                    "out"
                ]
            }
        },
        "x": 515,
        "y": 115,
        "config": {
            "transform": {
                "location": {
                    "76a77abf-d5ec-4b1c-b6e8-031359a6a640": {
                        "out": {
                            "type": "json2new",
                            "lambda": {
                                "city": "Prague",
                                "units": "metric"
                            }
                        }
                    }
                }
            }
        }
    },
    "11f02d1e-106e-4cf5-aae2-5514e531ea4d": {
        "type": "appmixer.slack.list.SendChannelMessage",
        "label": "SendChannelMessage",
        "source": {
            "message": {
                "a0828f32-34b8-4c8d-b6b3-1d82ca305921": [
                    "weather"
                ]
            }
        },
        "x": 735,
        "y": 115,
        "config": {
            "properties": {
                "channelId": "C3FNGP5K5"
            },
            "transform": {
                "message": {
                    "a0828f32-34b8-4c8d-b6b3-1d82ca305921": {
                        "weather": {
                            "type": "json2new",
                            "lambda": {
                                "text": "City: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[name]}}}\nHumidity: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.humidity]}}}\nPressure: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.pressure]}}}\nTemperature: {{{$.a0828f32-34b8-4c8d-b6b3-1d82ca305921.weather.[main.temp]}}}"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

The flow descriptor contains information about the components in the flow and their types, how they are interconnected (`source`), their properties (`config.properties`) and data transformation for all input ports (`config.transform`).
