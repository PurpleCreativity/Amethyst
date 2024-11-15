FROM denoland/deno

WORKDIR /src

ADD . /src
COPY . ./

RUN ls -l /src
RUN deno cache src/main.ts

EXPOSE 8000