import { Context, Schema, Session, h} from "koishi";
import { pathToFileURL } from 'url'
import type { OneBotBot } from "koishi-plugin-adapter-onebot";

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
  ctx
    .command("jmid <id>", "获取指定id jm漫画")
    .action(async ({ session }, id) => {
      getJM(ctx, config, session, id);
    })
    .example("jmid 422866 获取422866编号的jm漫画");
}

const getJM = async (
  ctx: Context,
  config: Config,
  session: Session,
  id: string
) => {
  if (!session.onebot) {
    session.send("暂仅支持onebot适配器喵");
    return;
  }
  if(!id){
    session.send('未提供id喵')
    return;
  }

  const url = config.url;
  ctx.http.get(`${url}/get_pdf_path/${id}`).then((res: any) => {
    console.log(res)
    if (res.success == true) {
      const { data: pdf_path, name } = res;
      const final_msg = h.file(pathToFileURL(pdf_path).href)
      session.send(final_msg)
    } else {
      session.send("后台发生错误");
    }
  });
};
