/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import type { DocContent } from '../types'
import { DOC_SAMPLES } from './samples'

export const EN_DOCS: DocContent = {
  title: 'API documentation',
  intro:
    'Call ByteDance Seedance video models through an OpenAI-compatible video API: create a task, check its progress, download the video. Three endpoints are all you need.',
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        {
          type: 'markdown',
          text: `**Base URL**: \`{{BASE_URL}}\`

Video generation is asynchronous: create a task to get a task ID, poll its status, then download the video once it completes.

| Model | Resolution | Duration | Notes |
| --- | --- | --- | --- |
| \`seedance-2.0\` | 480p / 720p / 1080p / 4k | 4–15 s | Stable and cost-effective, up to 4K |
| \`seedance-2.5\` | 480p / 720p / 1080p | 4–30 s | More natural motion, longer clips |

Both models support text-to-video, generation from reference images / videos / audio, and first-and-last-frame generation. See live prices in the [Model Square](/pricing).`,
        },
      ],
    },
    {
      id: 'quickstart',
      title: 'Quick start',
      blocks: [
        {
          type: 'markdown',
          text: `1. [Sign up](/sign-up) and sign in;
2. Top up on the Wallet page of the console;
3. Create an API key (starting with \`sk-\`) on the API Keys page;
4. Call the three endpoints below in order: create a task → check its status → download the video.`,
        },
        {
          type: 'code',
          label: '1. Create a task',
          code: DOC_SAMPLES.quickCreate,
        },
        {
          type: 'code',
          label: '2. Check the status',
          code: DOC_SAMPLES.quickQuery,
        },
        {
          type: 'code',
          label: '3. Download the video',
          code: DOC_SAMPLES.quickDownload,
        },
      ],
    },
    {
      id: 'authentication',
      title: 'Authentication',
      blocks: [
        {
          type: 'markdown',
          text: 'Every request must carry your API key in the request header:',
        },
        { type: 'code', label: 'HTTP Header', code: DOC_SAMPLES.authHeader },
        {
          type: 'markdown',
          text: `- Send the full key, including the \`sk-\` prefix;
- Keep the key on your server. Never put it in web or app front-end code;
- If a key leaks, delete it on the API Keys page right away and create a new one.`,
        },
      ],
    },
    {
      id: 'create',
      title: 'Create a task',
      blocks: [
        {
          type: 'markdown',
          text: `\`POST /v1/videos\` with a JSON body (\`Content-Type: application/json\`).

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| \`model\` | string | Yes | \`seedance-2.0\` or \`seedance-2.5\` |
| \`prompt\` | string | Yes | Text description of the video; must not be empty |
| \`seconds\` | integer | Yes | Duration in seconds: 4–15 for seedance-2.0, 4–30 for seedance-2.5 |
| \`resolution\` | string | Yes | \`480p\`, \`720p\`, \`1080p\`, \`4k\` (4k on seedance-2.0 only) |
| \`ratio\` | string | No | Aspect ratio: \`16:9\`, \`9:16\`, \`1:1\`, \`21:9\`, \`4:3\`, \`3:4\` |
| \`n\` | integer | No | Number of videos; only \`1\` is supported |
| \`images\` | string[] | No | Public URLs of reference images |
| \`videos\` | string[] | No | Public URLs of reference videos (billed extra by tokens, see Billing) |
| \`audios\` | string[] | No | Public URLs of reference audio |
| \`first_image_url\` | string | No | Public URL of the first-frame image |
| \`last_image_url\` | string | No | Public URL of the last-frame image; use together with \`first_image_url\` |

**Aliases**: \`duration\` is the same as \`seconds\`; \`size\` takes a pixel size (such as \`1280x720\`) in place of \`resolution\` and \`ratio\`; \`first_image\` / \`last_image\` are the same as the frame parameters. Send only one form of each parameter.

**Not supported**: \`seed\`, \`quality\`, \`callback_url\`, streaming and remix. Requests with unsupported parameters are rejected.

**Media**: reference images, videos, audio and frames must be public HTTP(S) links that can be fetched directly — not URLs behind a login and not local file paths.`,
        },
        {
          type: 'code',
          label: 'Example: vertical video from a reference image',
          code: DOC_SAMPLES.createFull,
        },
        {
          type: 'code',
          label: 'Example: first and last frame',
          code: DOC_SAMPLES.firstLastFrame,
        },
        {
          type: 'markdown',
          text: 'A successful request returns the task. Keep its `id`; you need it to check the status and download the video:',
        },
        { type: 'code', label: 'Response', code: DOC_SAMPLES.createResponse },
      ],
    },
    {
      id: 'query',
      title: 'Check a task',
      blocks: [
        {
          type: 'markdown',
          text: `\`GET /v1/videos/{id}\`. Poll about every 5 seconds. You can only read tasks created by your own account.

| \`status\` | Meaning | What to do |
| --- | --- | --- |
| \`queued\` | Waiting in the queue | Keep polling |
| \`in_progress\` | Generating; \`progress\` is a percentage | Keep polling |
| \`completed\` | Done | Download the video |
| \`failed\` | Failed | Stop polling and read the reason in \`error\` |

A task can also come back as \`failed\` right when it is created (for example, when the content is rejected by moderation). Once completed, \`metadata.url\` is the download path and \`completed_at\` is the completion time:`,
        },
        {
          type: 'code',
          label: 'Response when completed',
          code: DOC_SAMPLES.completedResponse,
        },
      ],
    },
    {
      id: 'download',
      title: 'Download the video',
      blocks: [
        {
          type: 'markdown',
          text: `\`GET /v1/videos/{id}/content\`, once the status is \`completed\`. This also requires your API key.

- The endpoint may return the file directly or redirect to temporary storage. With cURL, add \`-L\` to follow the redirect;
- Do not forward your API key to the storage host (cURL, Python requests and Node.js fetch drop it on cross-host redirects by default);
- The temporary link expires, so download and keep your own copy of the video.`,
        },
      ],
    },
    {
      id: 'examples',
      title: 'Full code examples',
      blocks: [
        {
          type: 'markdown',
          text: 'These examples run the full create → poll → download flow. Set the `API_KEY` environment variable first.',
        },
        {
          type: 'code',
          label: 'Python (requires requests)',
          code: DOC_SAMPLES.python,
        },
        { type: 'code', label: 'Node.js', code: DOC_SAMPLES.node },
      ],
    },
    {
      id: 'billing',
      title: 'Billing',
      blocks: [
        {
          type: 'markdown',
          text: `- Billed by **video duration (seconds) × the per-second price of the resolution**. Prices differ by model and resolution; the [Model Square](/pricing) shows the current prices;
- The cost is reserved when you create a task and settled on actual usage when it completes;
- **If a task fails, the reserved amount is refunded automatically.** Charges and refunds appear in the usage logs of the console;
- Reference videos (\`videos\`) are billed extra, based on their token usage;
- Requests are rejected when your balance is too low. Top up on the Wallet page first.`,
        },
      ],
    },
    {
      id: 'errors',
      title: 'Errors and retries',
      blocks: [
        {
          type: 'markdown',
          text: `| Case | What to do |
| --- | --- |
| 400 validation error | Check the model name, duration range, resolution, parameter names and media URLs |
| 401 / 403 | Check that the key is complete and not deleted or expired; do not retry automatically |
| Insufficient balance | Top up on the Wallet page, then submit again |
| 404 or \`task_not_exist\` | Check the task ID and that your account created it |
| 429 / temporary query failure | Poll less often and query the same task ID again later |
| Timeout, disconnect or 5xx when creating | The task may have been created. Check the task logs in the console first — **do not just submit again** |

When a task fails, \`error\` gives the reason:

- \`video_request_rejected\`: the request or content was rejected (for example by moderation);
- \`video_generation_cancelled\`: the task was cancelled;
- \`video_generation_failed\`: any other generation failure.

> Every \`POST /v1/videos\` creates a new billable task. If you lose a task ID, find it in the console instead of submitting again.`,
        },
      ],
    },
    {
      id: 'faq',
      title: 'FAQ',
      blocks: [
        {
          type: 'markdown',
          text: `**How long does a video take?**
It depends on duration, resolution and queue length. Rely on the polled status and avoid short client timeouts.

**Can I use the OpenAI SDK?**
Paths and responses follow the OpenAI video API, so plain HTTP requests work well. Use the parameters in this document.

**How do I use a local image?**
The API only takes public URLs. Upload the image to object storage or an image host first, then pass its link.

**How long is the video kept?**
The download link is temporary. Download and save the video soon after the task completes.`,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      blocks: [
        {
          type: 'markdown',
          text: `- International customers: Telegram [@APIFinder_Support](https://t.me/APIFinder_Support)
- Mainland China customers: QQ **3895235714**

Include the task ID and request time when you report a problem. Our staff never message you first and never ask for your password or API key.`,
        },
      ],
    },
  ],
}
