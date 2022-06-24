## Original Prompt
### Metronome Take-home Code Screen

Attached, find the file `events.csv`, which contains a log of events with the
the format customer\_id, event\_type, transaction\_id, timestamp.

Your task is to write a program that answers the following question:

> How many events did customer X send in the one hour buckets between timestamps A and B.

Choice of language, platform, and libraries is left up to you, as long as the
person evaluating your submission doesn't have to think too hard to figure out
how to run it. We all use recent macOS with recent Docker.

We expect this exercise to take 1-3 hours.

*Bonus:* Include an HTTP service that answers the same question.

## Setup

1. To run this application, simply run `docker-compose up -d`. This will start 3 containers: the QuestDB database, the Node Express server, and a Node process to migrate the events data into the DB (please give it a few seconds to finish populating before sending any http requests!)
2. To send requests, use `curl` or an API client and the route:
```
http://localhost:3000/v1/customers/{customer_id}/total_events?starting_at={start_ts}&ending_before={end_ts}
```
  - Ex curl request:
    ```
    curl http://localhost:3000/v1/customers/b4f9279a0196e40632e947dd1a88e857/total_events?starting_at='2021-03-01'&ending_before='2021-03-02'
    ```
  - For `start_ts` and `end_ts`, most common timestamp formats are supported. For more precision, the following format is suggested: `yyyy-MM-dd HH:mm:ss` (ex: 2017-08-19 12:17:55)

## Design Overview

The service is built as a Node app using the Express framework, powered by a time series Database called QuestDB. It is Dockerized for convenience, using Docker Compose to manage the different containers. A simple route is exposed to allow for event aggregation for specific customers.

### App Structure and Framework

Node and Express were chosen due to familiarity and ease of setup. For simplicity, the folder structure is kept pretty minimal and is based around the `routes` we use (in this case, just `/customers`). For a more complex application, we could include concepts like `services`, `models`, and `controllers` to keep the application more modular, but the current structure seems sufficient for our use case. An additional `tests/` modules provides basic unit tests.

### API Design

The main endpoint for this application is:

`GET /v1/customers/{customer_id}/total_events`

The following *optional* parameters are accepted: `starting_at`, and `end_before`. This specific design was selected for a few reasons:

- GET normally suggests viewing something without changing it, and the parameters `starting_at` and `end_before` are optional since the user could choose to request all events in a customers lifetime if those weren’t included. We could consider adding a maximum time range for requesting event aggregation if our data grew too much; though for this dataset this isn’t a constraint we need to enforce yet
- `/total_events` could have been called something like `usage`, and specifies that this is an aggregate we’re returning and not a list of events
- `v1` is included to give us the flexibility of adding new versions to our application in the future if we needed to. In a real application, we’d structure the routers to include/use the version a bit differently than in this sample app.
- Very basic error handling is implemented for routes that don’t exist, and any errors we might run into on the `/customers` route. In production these would be more sophisticated.
- No validation was added to the parameters `customer_id`, `starting_at`, and `end_before` due to time constraints. On a real application, we’d have middleware performing schema validation for these fields to provide friendlier error messages and avoid unintended behavior in our application.

**Alternatives Considered**

If we were designing a more generic aggregator, we could make an `/events` path that takes in aggregates for certain metrics, like customers (ex: `/events/customers/{id}/total_events`) or event type (`ex: /events/types/{type}/total_events`). Since in this case we are assuming we will only have one type of event, our only variable metric over time is the customer. Therefore, a more specific route for `/customers` was chosen.

Another path we could have taken is to make the aggregation endpoint a `POST` request; in which case we would be passing in our search parameters as the body of the payload. This has some advantages, such as being able to save and surface to the user previous searches made and caching results on the server more easily; but for simplicity, a more striaghtforward `GET` route was chosen.

### Data Storage & Querying

A time series database was chosen for persistent storage as it is optimized to perform aggregation queries over time periods. QuestDB was selected in particular due to its friendly documentation and support of traditional SQL queries.

Although a time series database has some great advantages when it comes to optimizing storage and query performance for data that has timestamps, it also comes with some disadvantages that made populating it with the `events.csv` data a bit of a challenge:

- Time series data is sorted by time. Therefore, the database is meant to be used by appending new data. Populating a table with out of order time data (such as the `events.csv`) can therefore be a challenge. To get around this, I had to add a “commit lag” to the `events` table so that the database could re-order events under-the-hood before committing it to persistent memory

A `migrate` command is provided (executed with `npm run migrate`) to populate the database with our `events.csv` data. For convenience, this command is run when the containers are started, but in a real application we would want to separate these processes out.

It is worth noting that in populating the DB we are making certain assumptions about the data:

- We are assuming that the data is correct. Even if some fields are not formatted consistently (ex: if we have some variation on what the `transaction_id` format looks like), we choose to still ingest and save the data rather than lose it. On a production application, we could implement some sort of alerting when importing fields that don’t follow a pre-defined schema so that an engineer can investigate/clean up the data after the fact. In general, we would rather not lose any data by not saving it, though we would definitely want to investigate if data was coming in in an unexpected format, as that could suggest some upstream issues.

**Alternatives Considered**

- Pre Aggregated Views:
    - In case our aggregation parameters were **pre-determined**, such as having uniform hourly buckets (ex: 1-2, 2-5, etc.), and approach to speed up our queries would have been to pre-aggregate the data. Assuming 24 time buckets per day, this would mean that we would need to keep track of up to `24 * customer_#` rows of data per day. This could exist in a relational or non relational database. The advantage of this approach is that aggregation could be done very quickly (since the data is pre-aggregated). The disadvantage is that in the case we need time periods in between buckets (which we do) this approach becomes more complicated, and we still need to store the “raw” event data since we can’t rely purely on the aggregates. This approach was therefore discarded.

- Third Party Service:
    - A service like Metronome purpose built for something like this could save a lot of development time. In a real production setting, this option would be considered more seriously and evaluated on the cost of the service & implementation vs. the other alternatives considered. For the purposes of this excercise, this option was discarded to build something from the ground-up.

## Limitations & Extensions

Due to the time constraints, the application is pretty limited in scope. We can’t add events or remove events outside of modifying the `events.csv` and resetting the DB, re-importing everything. Adding this functionality would be reasonably simple: we could add a `/events` route with paths for adding and removing events.
