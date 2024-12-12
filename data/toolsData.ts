interface Tool {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const toolsData: Tool[] = [
  {
    title: 'Image to text',
    description: `Generate description and recognize text in images using AI models`,
    href: 'https://img2txt.kezhenxu94.me',
  },
  {
    title: 'Inpaint images',
    description: `Inpaint images using AI models, right inside your browser, with WASM`,
    href: 'https://inpaint.kezhenxu94.me',
  },
  {
    title: 'PDF tools',
    description: `Instantly view, merge, and adjust PDFs without exposing sensitive information.`,
    href: 'https://pdf.kezhenxu94.me',
  },
  {
    title: '中文简体繁体转换',
    description: `直接在你的浏览器中进行中文简繁体转换, 无需连接服务器, 完全在本地浏览器运行.`,
    href: 'https://cc.kezhenxu94.me',
  }
]

export default toolsData
