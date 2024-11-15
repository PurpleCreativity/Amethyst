FROM denoland/deno

WORKDIR /src

COPY . ./

EXPOSE 8000

CMD ["deno", "task", "build"]