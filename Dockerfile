FROM denoland/deno

WORKDIR /src

COPY . ./

RUN ls -l /src
RUN deno cache src/main.ts

EXPOSE 8000

CMD ["deno", "task", "dev"]