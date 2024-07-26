// main.go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

var clients = make(map[*Client]bool)
var broadcast = make(chan []byte)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var mutex = &sync.Mutex{}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("Failed to upgrade:", err)
		return
	}
	client := &Client{conn: conn, send: make(chan []byte)}
	mutex.Lock()
	clients[client] = true
	mutex.Unlock()

	go readPump(client)
	go writePump(client)
}

func readPump(client *Client) {
	defer func() {
		mutex.Lock()
		delete(clients, client)
		mutex.Unlock()
		client.conn.Close()
	}()
	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		log.Printf("Received: %s", message)
	}
}

func writePump(client *Client) {
	defer client.conn.Close()
	for {
		select {
		case message, ok := <-client.send:
			if !ok {
				client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			client.conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func broadcastMessage(message []byte) {
	mutex.Lock()
	defer mutex.Unlock()
	for client := range clients {
		select {
		case client.send <- message:
		default:
			close(client.send)
			delete(clients, client)
		}
	}
}

func handleRest(c *gin.Context) {
	filename := c.Query("filename")
	title := c.Query("title")
	description := c.Query("description")
	tag := c.Query("tag")

	if filename == "" || title == "" || description == "" || tag == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}

	message := map[string]string{
		"filename":    filename,
		"title":       title,
		"description": description,
		"tag":         tag,
	}
	messageJSON, err := json.Marshal(message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal message"})
		return
	}

	broadcast <- messageJSON
	c.JSON(http.StatusOK, gin.H{"status": "message sent"})
}

func main() {
	router := gin.Default()

	router.GET("/ws", handleWebSocket)
	router.GET("/api/send", handleRest)

	go func() {
		for {
			message := <-broadcast
			broadcastMessage(message)
		}
	}()
	router.Run(":8080")
}
