import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import { IEvent } from "@/database";
import { getSimilarEventsBySlug } from "@/lib/actions/event.action";
import EventCard from "@/components/EventCard";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string; }) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p> {label} </p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <ul>
      {agendaItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>{tag}</div>
    ))}
  </div>
);

const EventDetails = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const request = await fetch(`${BASE_URL}/api/events/${slug}`, { cache: "no-store" });
  if (!request.ok) {
    return notFound();
  }
  const text = await request.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return notFound();
  }
  const event = data?.event;

  if (!event || !event.description) return notFound();

  const { description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } = event;

  const agendaItems: string[] = Array.isArray(agenda) ? agenda : JSON.parse(agenda);
  const tagItems: string[] = Array.isArray(tags) ? tags : JSON.parse(tags);

  const bookings = 10;

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        <div className="content">
          <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event details</h2>

            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
            <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
          </section>

          <EventAgenda agendaItems={agendaItems} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tagItems} />
        </div>

        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent eventId={event._id.toString()} slug = {slug} />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
            <EventCard key={(similarEvent as any)._id?.toString() || (similarEvent as any).slug} {...similarEvent} />
          ))}
        </div>
      </div>
    </section>
  );
};

const EventDetailsPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventDetails params={params} />
    </Suspense>
  );
};

export default EventDetailsPage;
