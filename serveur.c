#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/socket.h>

#define PORT 8080
#define BUFSIZE 8096

void serveFile(int client_fd, const char *uri) {
    char buffer[BUFSIZE];
    FILE *file;

    // Prévenir le directory traversal attack
    if (strstr(uri, "..")) {
        write(client_fd, "HTTP/1.1 403 Forbidden\n\nForbidden\n", 35);
        return;
    }

    // Traiter la racine / comme index.html
    if (strcmp(uri, "/") == 0) {
        uri = "/index.html";
    }

    file = fopen(uri + 1, "rb"); // On saute le premier caractère '/'
    if (file == NULL) {
        write(client_fd, "HTTP/1.1 404 Not Found\n\nFile not found\n", 44);
    } else {
        write(client_fd, "HTTP/1.1 200 OK\n\n", 17);
        while (!feof(file)) {
            int bytes_read = fread(buffer, 1, BUFSIZE, file);
            write(client_fd, buffer, bytes_read);
        }
        fclose(file);
    }
}

int main() {
    int server_fd, client_fd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t sin_len = sizeof(client_addr);
    char buffer[BUFSIZE];
    char *method, *uri;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("Cannot open socket");
        exit(EXIT_FAILURE);
    }

    int yes = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)) < 0) {
        perror("setsockopt failed");
        exit(EXIT_FAILURE);
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Cannot bind");
        close(server_fd);
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) < 0) {
        perror("Cannot listen");
        close(server_fd);
        exit(EXIT_FAILURE);
    }

    printf("Server is listening on port %d...\n", PORT);

    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &sin_len);
        if (client_fd < 0) {
            perror("Cannot accept connection");
            continue;
        }

        memset(buffer, 0, BUFSIZE);
        read(client_fd, buffer, BUFSIZE - 1);

        // Très basique: ne parse que la première ligne
        method = strtok(buffer, " ");
        uri = strtok(NULL, " ");
        if (uri) {
            printf("Serving URI: %s\n", uri);
            serveFile(client_fd, uri);
        }

        close(client_fd);
    }

    close(server_fd);
    return 0;
}
