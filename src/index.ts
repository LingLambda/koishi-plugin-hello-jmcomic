import { Context, Schema, h } from "koishi";

export const usage = `
  <h2>请先部署 <a href="https://github.com/LingLambda/JMComic-Api">JMComic-Api</a></h2>

  <p>使用： jmid 422866 获取422866编号的jm漫画</p>
`;
export const name = "hello-jmcomic";

export const inject = ["http"];

export interface Config {
  url: string;
}

export const Config: Schema<Config> = Schema.object({
  url: Schema.string().description("api路径").default("http://127.0.0.1:8699"),
});

export function apply(ctx: Context, config: Config) {
  ctx.command("jmid <id>", "获取指定id jm漫画")
    .example("jmid 422866 获取422866编号的jm漫画")
    .action(async ({ session }, id) => {
      if (session.platform !== "onebot") {
        await session.send("暂仅支持onebot适配器喵");
        return;
      }
      if (!id) {
        await session.send('未提供id喵')
        return;
      }

      const url = config.url;
      ctx.http.get(`${url}/get_pdf_path/${id}`).then(async (res: any) => {
        console.log(res)
        if (res.success == true) {
          const { data: pdf_path } = res;
          await session.send(h.file(pdf_path))
          return
        } else {
          await session.send("后台发生错误");
        }
      });
    })
}
