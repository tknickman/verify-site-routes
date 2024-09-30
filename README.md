# `verify-site-routes`

This is a simple tool to verify that all the routes in a site are reachable. It is useful for checking that all the links in a site are valid when migrating from a monolith to a micro-frontend architecture.

This works by:
1. Fetching the sitemap from the source site
2. Extracting all the URLs from the sitemap
3. Checking that the target site responds with a 200 status code for each URL

## Requirements
1. An XML sitemap at the root of the source site
2. Both sites are publicly accessible, or the target site supports a deployment protection bypass header

## Usage
```bash
Usage: verify-site-routes verify [options] <source> [target]

verify the pages in a sitemap

Arguments:
  source                        the domain to source the sitemap
  target                        the domain the check the routes from "source" against

Options:
  --batch                       the number of routes to check in parallel
  --path <pathFilter>           filter the routes to check by a path prefix
  --protection-bypass <bypass>  bypass value for target deployment protection
  -h, --help                    display help for command
```

## Examples

1. Use a deployment protection bypass for the target

```bash
pnpm cli verify <source> [target] --protection-bypass <key> 
```

2. Only check paths starting with a given path

```bash
pnpm cli verify <source> [target] --protection-bypass 9P9ZmVKkVyFBAb76AHKqG5JoTUHh9Xyu --path=/<path>
```

