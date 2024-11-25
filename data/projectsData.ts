interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'Apache SkyWalking',
    description: `Apache Skywalking is an application performance monitor tool for distributed systems, especially designed for microservices, cloud native and container-based (Kubernetes) architectures.
As a core maintainer of Apache SkyWalking, I help to manage the project and contribute to the codebase in various ways, including developing features, fixing bugs, evolving the CI infrastructure, initiating sub projects and more.`,
    imgSrc: '/static/images/skywalking-logo.png',
    href: 'https://skywalking.apache.org',
  },
  {
    title: 'Message AI',
    description: `Message AI is a conversational AI application for macOS, iOS, and iPadOS that allows you to chat with AI models, including ChatGPT, Stable Diffusion and Text-to-Speech models.
As the author of Message AI, I designed and developed the application from scratch, including the UI/UX, the backend API, and the integration with AI models.`,
    imgSrc: '/static/images/message-ai-logo.png',
    href: 'https://apps.apple.com/app/message-ai/id6448740961',
  },
]

export default projectsData
