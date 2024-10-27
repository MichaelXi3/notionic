## Features

**Writing posts using notion**

- No need of commiting to Github for posting anything to your website.
- Posts made on Notion are automaticaly updated on your site.

**Use as a page as resume**

- Useful for generating full page sites using Notion.
- Can be used for Resume, Portfolios etc.

**Customisable and Supports various plugin through CONFIG**

- Your profile information can be updated through Config. (`site.config.js`)
- Plugins support includes, Google Analytics, Search Console and also Commenting using Github Issues(Utterances) or Cusdis.

## Getting Started

1. Star this repo.
2. [Fork](https://github.com/morethanmin/morethan-log/fork) the repo to your Profile.
3. Duplicate [this Notion template](https://morethanmin.notion.site/12c38b5f459d4eb9a759f92fba6cea36?v=2e7962408e3842b2a1a801bf3546edda), and Share to Web.
4. Copy the Web Link and keep note of the Notion Page Id from the Link which will be in this format [username.notion.site/`NOTION_PAGE_ID`?v=`VERSION_ID`]. 
5. Clone your forked repo and then customize `site.config.js` based on your preference.
6. Deploy on Vercel, with the following environment variables.

   - `NOTION_PAGE_ID` (Required): The Notion page Id got from the Share to Web URL. This is not the entire URL, but just the NOTION_PAGE_ID part as shown above.
   - `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` : For Google analytics Plugin.
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` : For Google search console Plugin.
   - `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` : For Naver search advisor Plugin.
   - `NEXT_PUBLIC_UTTERANCES_REPO` : For Utterances Plugin.

## License

The [MIT License](LICENSE).
