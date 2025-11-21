# Test Plan Report

## 1. ListModels
```
appmixer test component src/appmixer/grok/core/ListModels/ -p "{"outputType":"array"}"
```
<details><summary>✅ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -p "{"outputType":"array"}"
```
<details><summary>✅ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -p "{"outputType":"array"}"
```
<details><summary>✅ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -p "{"outputType":"array"}"
```
<details><summary>✅ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

```
appmixer test component src/appmixer/grok/core/ListModels/ -p "{"outputType":"array"}"
```
<details><summary>✅ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ListModels
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.
Your component didn't send anything to it's output port(s). Make sure you don't call 'context.sendJson' method after promise from component's method has been resolved.
</details>

## 2. ChatCompletion
```
appmixer test component src/appmixer/grok/core/ChatCompletion/ -i '{"in":{"model":"grok-3-latest","messagesRole":"user","messagesContent":"What is the capital of France?"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'f2a45b50-92c1-5d67-e8c3-5c1e0c391eed',
  Object: 'chat.completion',
  Created: 1763718969,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 13,
    completion_tokens: 7,
    total_tokens: 20,
    prompt_tokens_details: {
      text_tokens: 13,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  },
  'System Fingerprint': 'fp_bc87f7da14'
}

Component's receive method finished in: 536 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 3. StreamingResponse
```
appmixer test component src/appmixer/grok/core/StreamingResponse/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"What is the capital of France?","stream":true,"temperature":0.7,"max_tokens":100}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718984,"model":"grok-3","choices":[{"index":0,"delta":{"content":"The","role":"assistant"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":" capital"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":" of"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":" France"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":" is"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":" Paris"}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{"content":"."}}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: {"id":"d4f886cb-4c7e-36ae-7b8a-de55b9f45de0","object":"chat.completion.chunk","created":1763718985,"model":"grok-3","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"system_fingerprint":"fp_bc87f7da14"}\n' +
  '\n' +
  'data: [DONE]\n' +
  '\n'



Component's receive method finished in: 1558 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 4. ReasoningCompletion
```
appmixer test component src/appmixer/grok/core/ReasoningCompletion/ -i '{"in":{"model":"grok-3-mini-latest","messages":[{"role":"user","content":"What is 2+2? Please reason through this step by step."}],"reasoning_effort":"medium","temperature":0.7,"max_tokens":500}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'a918bb9e-f06c-5a67-a788-88c6471d6caf',
  Object: 'chat.completion',
  Created: 1763719001,
  Model: 'grok-3-mini-high',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 22,
    completion_tokens: 255,
    total_tokens: 680,
    prompt_tokens_details: {
      text_tokens: 22,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 403,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 4962 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 5. ImageGeneration
```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"size":"1024x1024","response_format":"b64_json","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageGeneration
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      model:           grok-2-image-latest
      prompt:          A serene landscape with mountains and a lake at sunset
      n:               1
      size:            1024x1024
      response_format: b64_json
      outputType:      array
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Argument not supported: size
</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"response_format":"b64_json","outputType":"array"}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageGeneration
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      model:           grok-2-image-latest
      prompt:          A serene landscape with mountains and a lake at sunset
      n:               1
      response_format: b64_json
      outputType:      array
    scope: 

[ERROR]: Request failed with status code 400
code:  400
error: Argument not supported: size
</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A serene landscape with mountains and a lake at sunset","n":1,"response_format":"b64_json","outputType":"array"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  result: [
    {
      b64_json: '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'... 67640 more characters,
      revised_prompt: "A high-resolution photograph of a serene landscape at sunset, featuring majestic mountains reflected in a calm lake. The sky is painted with vibrant hues of orange and pink, with scattered clouds enhancing the sunset's beauty. The lake's surface is still, perfectly mirroring the mountains and the colorful sky. Surrounding the lake, there are gentle hills and trees, adding depth to the scene without distracting from the main elements. The overall composition focuses on the natural beauty of the landscape, creating a peaceful and tranquil atmosphere."
    }
  ],
  count: 1
}



Component's receive method finished in: 11253 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A futuristic city skyline at night with neon lights","n":1,"response_format":"url","outputType":"first"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  url: 'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-280ea9fe-bb38-4b9e-a9b1-ce5ecd21bf6d.jpeg',
  revised_prompt: 'A high-resolution photograph of a futuristic city skyline at night, featuring towering skyscrapers illuminated by vibrant neon lights in shades of blue, pink, and purple. The cityscape is reflected in a calm river in the foreground, adding depth to the scene. The sky is clear with visible stars, enhancing the nighttime atmosphere. The composition focuses on the skyline without any distracting foreground elements or additional subjects, ensuring the city lights are the main focus. The overall mood is serene yet lively, capturing the essence of a modern, technologically advanced city.',
  index: 0,
  count: 1
}



Component's receive method finished in: 11735 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageGeneration/ -i '{"in":{"model":"grok-2-image-latest","prompt":"A magical forest with glowing mushrooms and fireflies","n":1,"response_format":"b64_json","outputType":"object"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  b64_json: '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'... 110796 more characters,
  revised_prompt: 'A high-resolution photograph of a magical forest at twilight, featuring a large glowing mushroom as the central focus. The mushroom emits a soft, warm light, surrounded by smaller glowing mushrooms and numerous fireflies that dot the scene with twinkling lights. The forest is dense with tall, ancient trees, and the ground is covered with moss and ferns. A gentle stream flows through the background, reflecting the ethereal glow of the mushrooms and fireflies. The atmosphere is serene and mystical, with a soft mist enhancing the magical ambiance. The composition focuses primarily on the central mushroom and its immediate surroundings, creating a captivating and enchanting scene without unnecessary distractions.',
  index: 0,
  count: 1
}



Component's receive method finished in: 11341 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 6. ImageUnderstanding
```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","text":"What is in this image? Please describe what you see.","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1200px-Good_Food_Display_-_NCI_Visuals_Online.jpg","imageDetail":"auto","maxTokens":500}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '5f2f2d3d-701e-6fd8-5496-e59f168d23d6',
  Object: 'chat.completion',
  Created: 1763719103,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 275,
    completion_tokens: 292,
    total_tokens: 567,
    prompt_tokens_details: {
      text_tokens: 19,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 5261 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-vision-beta","role":"user","contentType":"image_url","text":"Analyze this image and tell me the main colors and composition.","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg","imageDetail":"high","maxTokens":300}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\grok\core\ImageUnderstanding
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined

Creating authentication module.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      model:       grok-vision-beta
      role:        user
      contentType: image_url
      text:        Analyze this image and tell me the main colors and composition.
      imageUrl:    https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg
      imageDetail: high
      maxTokens:   300
    scope: 

[ERROR]: Request failed with status code 404
code:  Some requested entity was not found
error: The model grok-vision-beta does not exist or your team c732a16f-e8ae-4fba-8e05-eb8a8f6aba39 does not have access to it. Please ensure you're using the correct API key. If you believe this is a mistake, please contact support and quote your team ID and the model name.
</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","text":"What objects are visible in this image?","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg","imageDetail":"low"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '81a07115-25f9-03c9-729c-bf82a8a977db',
  Object: 'chat.completion',
  Created: 1763719118,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 271,
    completion_tokens: 49,
    total_tokens: 320,
    prompt_tokens_details: {
      text_tokens: 15,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 1150 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","text":"Describe the details and colors in this image.","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg","imageDetail":"high","maxTokens":400}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'e15bd318-574c-b475-7c77-8d793d01a3c2',
  Object: 'chat.completion',
  Created: 1763719124,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 1808,
    completion_tokens: 372,
    total_tokens: 2180,
    prompt_tokens_details: {
      text_tokens: 16,
      audio_tokens: 0,
      image_tokens: 1792,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 6682 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/ImageUnderstanding/ -i '{"in":{"model":"grok-2-vision-latest","role":"user","contentType":"image_url","text":"What is this image about?","imageUrl":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'f44292e4-cc0c-8bad-3fe1-35b761fa6dde',
  Object: 'chat.completion',
  Created: 1763719136,
  Model: 'grok-2-vision-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 269,
    completion_tokens: 71,
    total_tokens: 340,
    prompt_tokens_details: {
      text_tokens: 13,
      audio_tokens: 0,
      image_tokens: 256,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 1708 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

## 7. StructuredOutput
```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-latest","role":"user","content":"Extract the name and age from this text: John is 30 years old.","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"name":{"type":"string","description":"The person'\''s name"},"age":{"type":"integer","description":"The person'\''s age"}},"required":["name","age"]},"strict":true,"maxTokens":200}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '97d24ca6-6abf-5e7b-41cf-03cc34dbe882',
  Object: 'chat.completion',
  Created: 1763719159,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 96,
    completion_tokens: 12,
    total_tokens: 108,
    prompt_tokens_details: {
      text_tokens: 96,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 2
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 1339 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-mini-latest","role":"user","content":"Generate a product review with title and rating. Product: Wireless Headphones","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"title":{"type":"string","description":"Review title"},"rating":{"type":"integer","minimum":1,"maximum":5,"description":"Rating from 1 to 5"},"review":{"type":"string","description":"Review text"}},"required":["title","rating","review"]},"maxTokens":300}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: '350409eb-1e49-1be7-9232-31fd63ac7503',
  Object: 'chat.completion',
  Created: 1763719165,
  Model: 'grok-3-mini',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 119,
    completion_tokens: 40,
    total_tokens: 570,
    prompt_tokens_details: {
      text_tokens: 119,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 8
    },
    completion_tokens_details: {
      reasoning_tokens: 411,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 4419 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-2-latest","role":"user","content":"Parse this event: Meeting scheduled for tomorrow at 2 PM with John about project updates","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"eventType":{"type":"string","description":"Type of event"},"time":{"type":"string","description":"Time of event"},"participants":{"type":"array","items":{"type":"string"},"description":"People involved"},"topic":{"type":"string","description":"Event topic"}},"required":["eventType","time","participants","topic"]},"strict":false}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'ed95529a-8893-00a9-0b9f-212b284e30e0',
  Object: 'chat.completion',
  Created: 1763719173,
  Model: 'grok-2-1212',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 133,
    completion_tokens: 24,
    total_tokens: 157,
    prompt_tokens_details: {
      text_tokens: 133,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 0
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 738 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

```
appmixer test component src/appmixer/grok/core/StructuredOutput/ -i '{"in":{"model":"grok-3-fast-latest","role":"system","content":"You are a JSON data extractor. Extract company information from text.","responseFormatType":"json_schema","jsonSchema":{"type":"object","properties":{"companyName":{"type":"string"},"industry":{"type":"string"},"foundedYear":{"type":"integer"},"employees":{"type":"integer"}},"required":["companyName","industry"]},"maxTokens":150}}'
```
<details><summary>✅ output</summary>Component has send a message to output port: out
{
  Id: 'edfc13fc-3c55-12ed-9f56-d260ee888eb7',
  Object: 'chat.completion',
  Created: 1763719178,
  Model: 'grok-3',
  Choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  Usage: {
    prompt_tokens: 93,
    completion_tokens: 35,
    total_tokens: 128,
    prompt_tokens_details: {
      text_tokens: 93,
      audio_tokens: 0,
      image_tokens: 0,
      cached_tokens: 5
    },
    completion_tokens_details: {
      reasoning_tokens: 0,
      audio_tokens: 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0
    },
    num_sources_used: 0
  }
}

Component's receive method finished in: 1505 ms.

Component's state at the end:
State is empty, component did not store anything into state.

Stopping component.</details>

