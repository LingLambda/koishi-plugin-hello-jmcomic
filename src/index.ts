import { Context, Schema, h } from "koishi"
import { pathToFileURL } from 'node:url'
export const name = "hello-jmcomic"

export const inject = ["http"]

export const usage =
  `
<h2>请先部署 <a href="https://github.com/LingLambda/JMComic-Api">JMComic-Api</a></h2>

<p>使用： jmid 422866 获取422866编号的jm漫画</p>
`
export interface Config {
  url: string
  onlyOneBot: boolean
  loginfo: boolean
}

export const Config: Schema<Config> = Schema.object({
  url: Schema.string().description("api路径").default("http://127.0.0.1:8699"),
  onlyOneBot: Schema.boolean().default(true).description("是否仅允许onebot平台调用<br>关闭后不限制平台"),
  loginfo: Schema.boolean().default(false).description("是否打印API调用日志"),
})

export function apply(ctx: Context, config: Config) {
  ctx.command("jmid <userinputid>", "获取指定id jm漫画")
    .example("jmid 422866 获取422866编号的jm漫画")
    .action(async ({ session }, userinputid) => {
      // 平台限制
      if (config.onlyOneBot && session.platform !== "onebot") {
        await session.send("暂仅支持onebot适配器喵~")
        return
      }

      if (!userinputid) {
        await session.send('未提供id喵~')
        await session.execute('jmid -h')
        return
      }

      const url = config.url.trim()
      try {
        const res = await ctx.http.get(`${url}/get_pdf_path/${userinputid}`)

        // 日志记录
        if (config.loginfo) {
          ctx.logger.info(`API Response: ${JSON.stringify(res)}`)
        }

        if (res.success === true) {
          const { data: pdf_path } = res
          await session.send(h.file(pathToFileURL(pdf_path).href))
          return
        } else {
          await session.send(`后台发生错误: ${res.message || '未知错误'}`) // 包含错误信息
        }
      } catch (error: any) {
        // 错误处理
        ctx.logger.error(`API 请求失败: ${error.message}`)
        await session.send(`请求API失败: ${error.message}`)
      }
    })
}
