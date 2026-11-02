import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { cacheLife } from "next/cache";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\s/g, '')?.replace(/\/$/, '') || "http://localhost:3000";

const Page = async () => {
  'use cache'
  cacheLife('hours')
  let events: IEvent[] = [];
  
  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      cache: "no-store"
    });
    if (response.ok) {
      const data = await response.json();
      events = data.events || [];
    }
  } catch (error) {
    console.error("Failed to fetch events:", error);
  }

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can't Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups and Conferences, All in one place
      </p>

    <ExploreBtn />  

    <div className="mt-20 space-y-7">
      <h3>Featured Events</h3>

        <ul className="events">
          {events.length > 0 ? (
            events.map((event: IEvent) => (
              <li key={event._id?.toString() || event.slug} className="list-none">
                  <EventCard {...event} />
              </li> 
            ))
          ) : (
            <p>No events found</p>
          )}
        </ul>
    </div>
    </section>
  );
};

export default Page;
