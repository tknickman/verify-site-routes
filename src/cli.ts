import { Command } from "commander";
import pkg from "../package.json";
import { validatePages } from "./validate";

const program = new Command();
program.name(pkg.name).description(pkg.description).version(pkg.version);

program
  .command("verify")
  .description("verify the pages in a sitemap")
  .argument("<source>", "the domain to source the sitemap")
  .argument("[target]", 'the domain the check the routes from "source" against')
  .option("--batch", "the number of routes to check in parallel", "10")
  .option("--path <pathFilter>", "filter the routes to check by a path prefix")
  .option("--protection-bypass <bypass>", "bypass value for target deployment protection")

  .action((source, target, options) => {
    const validateTarget = target ?? source;
    console.log(`Verifying pages from ${source} against ${validateTarget} (with batch size ${options.batch}`);
    validatePages(source, validateTarget, options);
  });

program.parseAsync();
