export interface EventItem {
  title: string;
  image: string;
  slug: string;
  location: string;
  date: string;
  time: string;
};

//Curated list of upcoming/popular developer events
//Image assets live under public/images and can be used directly with next/image
// via paths like "/images/event1.png"

export const events: EventItem[] = [
  {
    title: "React Summit 2026",
    image: "/images/event1.png",
    slug: "react-summit-2026",
    location: "Amsterdam, Netherlands",
    date: "2026-06-10",
    time: "09:00",
  },
  {
    title: "Google I/O 2026",
    image: "/images/event2.png",
    slug: "google-io-2026",
    location: "Mountain View, CA",
    date: "2026-05-20",
    time: "10:00",
  },
  {
    title: "HackMIT 2026",
    image: "/images/event3.png",
    slug: "hackmit-2026",
    location: "Cambridge, MA",
    date: "2026-09-12",
    time: "08:00",
  },
  {
    title: "AWS re:Invent 2026",
    image: "/images/event4.png",
    slug: "aws-reinvent-2026",
    location: "Las Vegas, NV",
    date: "2026-11-30",
    time: "08:30",
  },
  {
    title: "JSConf EU 2026",
    image: "/images/event5.png",
    slug: "jsconf-eu-2026",
    location: "Berlin, Germany",
    date: "2026-06-24",
    time: "09:00",
  },
  {
    title: "ETHGlobal Brussels",
    image: "/images/event6.png",
    slug: "ethglobal-brussels",
    location: "Brussels, Belgium",
    date: "2026-07-11",
    time: "09:00",
  },
];
