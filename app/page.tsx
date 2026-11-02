import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { cacheLife } from "next/cache";
import connectDB from "@/lib/mongodb";
import { Event } from "@/database";


const Page = async () => {
  'use cache'
  cacheLife('hours')
  let events: IEvent[] = [];
  
  try {
    await connectDB();
    events = await Event.find().sort({ createdAt: -1 }).lean();
  } catch (error) {
    throw error;
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
            events.map((event: any) => (
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
