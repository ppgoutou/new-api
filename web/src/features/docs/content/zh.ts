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

export const ZH_DOCS: DocContent = {
  title: 'API 开发文档',
  intro:
    '通过兼容 OpenAI 视频接口的 API 调用字节跳动 Seedance 视频模型：提交任务、查询进度、下载视频，三个接口即可完成接入。',
  sections: [
    {
      id: 'overview',
      title: '概览',
      blocks: [
        {
          type: 'markdown',
          text: `**接口地址（Base URL）**：\`{{BASE_URL}}\`

视频生成是异步任务：先提交任务拿到任务 ID，再轮询任务状态，完成后下载视频。

| 模型 | 分辨率 | 时长 | 说明 |
| --- | --- | --- | --- |
| \`seedance-2.0\` | 480p / 720p / 1080p / 4k | 4–15 秒 | 稳定、性价比高，最高 4K |
| \`seedance-2.5\` | 480p / 720p / 1080p | 4–30 秒 | 动作更自然，支持更长时长 |

两个模型都支持文生视频、参考图 / 视频 / 音频生成，以及首尾帧生成。实时价格见 [模型广场](/pricing)。`,
        },
      ],
    },
    {
      id: 'quickstart',
      title: '快速开始',
      blocks: [
        {
          type: 'markdown',
          text: `1. [注册账号](/sign-up)并登录；
2. 在控制台「钱包」页面充值；
3. 在「API 密钥」页面创建密钥（以 \`sk-\` 开头）；
4. 依次调用下面三个接口：提交任务 → 查询状态 → 下载视频。`,
        },
        { type: 'code', label: '1. 提交任务', code: DOC_SAMPLES.quickCreate },
        { type: 'code', label: '2. 查询状态', code: DOC_SAMPLES.quickQuery },
        { type: 'code', label: '3. 下载视频', code: DOC_SAMPLES.quickDownload },
      ],
    },
    {
      id: 'authentication',
      title: '鉴权',
      blocks: [
        {
          type: 'markdown',
          text: '所有请求都需要在请求头中携带 API 密钥：',
        },
        { type: 'code', label: 'HTTP Header', code: DOC_SAMPLES.authHeader },
        {
          type: 'markdown',
          text: `- 请填写完整的密钥，不要省略 \`sk-\` 前缀；
- 密钥只放在服务端，不要写进网页或 App 的前端代码；
- 密钥泄露后，请立即在「API 密钥」页面删除并重新创建。`,
        },
      ],
    },
    {
      id: 'create',
      title: '创建任务',
      blocks: [
        {
          type: 'markdown',
          text: `\`POST /v1/videos\`，请求体为 JSON（\`Content-Type: application/json\`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| \`model\` | string | 是 | \`seedance-2.0\` 或 \`seedance-2.5\` |
| \`prompt\` | string | 是 | 视频描述，不能为空 |
| \`seconds\` | integer | 是 | 时长（秒）：seedance-2.0 为 4–15，seedance-2.5 为 4–30 |
| \`resolution\` | string | 是 | \`480p\`、\`720p\`、\`1080p\`、\`4k\`（4k 仅 seedance-2.0） |
| \`ratio\` | string | 否 | 画面比例：\`16:9\`、\`9:16\`、\`1:1\`、\`21:9\`、\`4:3\`、\`3:4\` |
| \`n\` | integer | 否 | 生成数量，目前只能为 \`1\` |
| \`images\` | string[] | 否 | 参考图片的公网 URL |
| \`videos\` | string[] | 否 | 参考视频的公网 URL（另按 token 计费，见「计费说明」） |
| \`audios\` | string[] | 否 | 参考音频的公网 URL |
| \`first_image_url\` | string | 否 | 首帧图片的公网 URL |
| \`last_image_url\` | string | 否 | 尾帧图片的公网 URL，需与 \`first_image_url\` 一起使用 |

**兼容别名**：\`duration\` 等同于 \`seconds\`；\`size\` 可用像素写法（如 \`1280x720\`）代替 \`resolution\` 与 \`ratio\`；\`first_image\` / \`last_image\` 等同于首尾帧参数。同一含义的参数只传一种写法。

**暂不支持**：\`seed\`、\`quality\`、\`callback_url\`、流式输出和 remix。传入不支持的参数会被拒绝。

**素材要求**：参考图、视频、音频和首尾帧都必须是公网可直接访问的 HTTP(S) 链接，不能是需要登录的地址或本地文件路径。`,
        },
        {
          type: 'code',
          label: '示例：参考图生成竖屏视频',
          code: DOC_SAMPLES.createFull,
        },
        {
          type: 'code',
          label: '示例：首尾帧生成',
          code: DOC_SAMPLES.firstLastFrame,
        },
        {
          type: 'markdown',
          text: '提交成功后返回任务信息，请保存 `id`，后续查询和下载都要用到：',
        },
        { type: 'code', label: '返回示例', code: DOC_SAMPLES.createResponse },
      ],
    },
    {
      id: 'query',
      title: '查询任务',
      blocks: [
        {
          type: 'markdown',
          text: `\`GET /v1/videos/{id}\`，建议每 5 秒查询一次。只能查询自己账号创建的任务。

| 状态 \`status\` | 含义 | 处理 |
| --- | --- | --- |
| \`queued\` | 排队中 | 继续轮询 |
| \`in_progress\` | 生成中，\`progress\` 为进度百分比 | 继续轮询 |
| \`completed\` | 已完成 | 可以下载视频 |
| \`failed\` | 失败 | 停止轮询，查看 \`error\` 中的原因 |

任务也可能在提交时就直接返回 \`failed\`（例如内容未通过审核）。完成后的返回中，\`metadata.url\` 是下载地址，\`completed_at\` 是完成时间：`,
        },
        {
          type: 'code',
          label: '完成时的返回示例',
          code: DOC_SAMPLES.completedResponse,
        },
      ],
    },
    {
      id: 'download',
      title: '下载视频',
      blocks: [
        {
          type: 'markdown',
          text: `\`GET /v1/videos/{id}/content\`，状态为 \`completed\` 后再请求，同样需要携带 API 密钥。

- 接口可能直接返回视频文件，也可能重定向到临时存储地址。用 cURL 时请加上 \`-L\` 跟随跳转；
- 不要把 API 密钥转发给临时存储地址（cURL、Python requests、Node.js fetch 跨域跳转时默认不会转发）；
- 临时地址会过期，请下载后自行保存视频文件。`,
        },
      ],
    },
    {
      id: 'examples',
      title: '完整代码示例',
      blocks: [
        {
          type: 'markdown',
          text: '以下示例完成「提交 → 轮询 → 下载」全流程。运行前先设置环境变量 `API_KEY`。',
        },
        {
          type: 'code',
          label: 'Python（需安装 requests）',
          code: DOC_SAMPLES.python,
        },
        { type: 'code', label: 'Node.js', code: DOC_SAMPLES.node },
      ],
    },
    {
      id: 'billing',
      title: '计费说明',
      blocks: [
        {
          type: 'markdown',
          text: `- 按 **视频时长（秒）× 分辨率单价** 计费，不同模型、分辨率单价不同，以 [模型广场](/pricing) 显示的价格为准；
- 提交任务时按请求参数预扣费用，任务完成后按实际用量结算；
- **任务失败会自动退回预扣的费用**，可在控制台「使用日志」查看扣费与退款记录；
- 使用参考视频（\`videos\`）时，会根据参考视频的 token 用量额外计费；
- 余额不足时提交会被拒绝，请先在「钱包」充值。`,
        },
      ],
    },
    {
      id: 'errors',
      title: '错误与重试',
      blocks: [
        {
          type: 'markdown',
          text: `| 情况 | 处理建议 |
| --- | --- |
| 400 参数校验失败 | 检查模型名、时长范围、分辨率、参数写法和素材 URL |
| 401 / 403 | 检查密钥是否完整、是否已删除或过期；不要自动重试 |
| 余额不足 | 到「钱包」充值后再提交 |
| 404 或 \`task_not_exist\` | 检查任务 ID 是否正确、是否由当前账号创建 |
| 429 / 查询临时失败 | 降低轮询频率，用同一个任务 ID 稍后再查 |
| 提交时超时、断线或 5xx | 任务可能已经创建成功，先到控制台「任务日志」确认，**不要直接重新提交** |

任务失败时，\`error\` 中会给出原因分类：

- \`video_request_rejected\`：请求或内容被拒绝（如未通过内容审核）；
- \`video_generation_cancelled\`：任务被取消；
- \`video_generation_failed\`：其他生成失败。

> 每次 \`POST /v1/videos\` 都会创建一个新的计费任务。丢失任务 ID 时，请到控制台查找，不要通过重复提交来"找回"任务。`,
        },
      ],
    },
    {
      id: 'faq',
      title: '常见问题',
      blocks: [
        {
          type: 'markdown',
          text: `**生成一个视频要多久？**
取决于时长、分辨率和排队情况，请以轮询到的状态为准，不要设置过短的超时。

**可以用 OpenAI SDK 调用吗？**
接口路径和返回格式兼容 OpenAI 视频接口，可以直接用 HTTP 请求调用；参数请以本文档为准。

**上传本地图片怎么办？**
接口只接受公网 URL。请先把图片上传到对象存储或图床，再把链接填入参数。

**生成的视频能保存多久？**
下载地址是临时的，请在任务完成后尽快下载保存。`,
        },
      ],
    },
    {
      id: 'support',
      title: '联系支持',
      blocks: [
        {
          type: 'markdown',
          text: `- 中国大陆客户：QQ **3895235714**
- 海外客户：Telegram [@APIFinder_Support](https://t.me/APIFinder_Support)

反馈问题时请附上任务 ID 和请求时间，便于排查。官方人员不会主动私聊，也不会索要您的账号密码或 API 密钥。`,
        },
      ],
    },
  ],
}
