class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.canvas.width = 800
    this.canvas.height = 600

    this.player = new Player(this.canvas.width / 2, this.canvas.height - 60)
    this.bullets = []
    this.enemies = []
    this.particles = []
    this.powerUps = []

    this.score = 0
    this.level = 1
    this.gameRunning = true
    this.keys = {}

    this.enemySpawnTimer = 0
    this.enemySpawnRate = 60
    this.powerUpSpawnTimer = 0

    this.stars = []
    this.initStars()

    this.setupEventListeners()
    this.gameLoop()
  }

  initStars() {
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2,
      })
    }
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true
    })

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false
    })
  }

  update() {
    if (!this.gameRunning) return

    // Update stars
    this.stars.forEach((star) => {
      star.y += star.speed
      if (star.y > this.canvas.height) {
        star.y = 0
        star.x = Math.random() * this.canvas.width
      }
    })

    // Player movement
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
      this.player.moveLeft()
    }
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
      this.player.moveRight(this.canvas.width)
    }
    // Update player
    this.player.update()
    if (this.keys["KeyX"]) {
      const bullet = this.player.shoot()
      if (bullet) {
        this.bullets.push(bullet)
      }
    }

    // Update bullets
    this.bullets = this.bullets.filter((bullet) => {
      bullet.update()
      return bullet.y > 0
    })

    // Spawn enemies
    this.enemySpawnTimer++
    if (this.enemySpawnTimer >= this.enemySpawnRate) {
      this.enemies.push(new Enemy(Math.random() * (this.canvas.width - 40), -40))
      this.enemySpawnTimer = 0

      // Increase difficulty
      if (this.enemySpawnRate > 20) {
        this.enemySpawnRate -= 0.5
      }
    }

    // Update enemies
    this.enemies = this.enemies.filter((enemy) => {
      enemy.update()

      // Check collision with player
      if (this.checkCollision(enemy, this.player)) {
        this.gameOver()
        return false
      }

      return enemy.y < this.canvas.height + 40
    })

    // Check bullet-enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        if (this.checkCollision(this.bullets[i], this.enemies[j])) {
          // Create explosion particles
          this.createExplosion(this.enemies[j].x + 20, this.enemies[j].y + 20)

          // Remove bullet and enemy
          this.bullets.splice(i, 1)
          this.enemies.splice(j, 1)

          // Increase score
          this.score += 10

          // Chance to spawn power-up
          if (Math.random() < 0.1) {
            this.powerUps.push(
              new PowerUp(this.enemies[j]?.x || Math.random() * this.canvas.width, this.enemies[j]?.y || 100),
            )
          }

          break
        }
      }
    }

    // Update power-ups
    this.powerUps = this.powerUps.filter((powerUp) => {
      powerUp.update()

      // Check collision with player
      if (this.checkCollision(powerUp, this.player)) {
        this.player.activatePowerUp()
        return false
      }

      return powerUp.y < this.canvas.height + 20
    })

    // Update particles
    this.particles = this.particles.filter((particle) => {
      particle.update()
      return particle.life > 0
    })

    // Update level
    this.level = Math.floor(this.score / 100) + 1
  }

  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    )
  }

  createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(x, y))
    }
  }

  render() {
    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, "#0a0a2e")
    gradient.addColorStop(1, "#16213e")
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw stars
    this.ctx.fillStyle = "#ffffff"
    this.stars.forEach((star) => {
      this.ctx.globalAlpha = 0.8
      this.ctx.fillRect(star.x, star.y, star.size, star.size)
    })
    this.ctx.globalAlpha = 1

    // Draw game objects
    this.player.render(this.ctx)
    this.bullets.forEach((bullet) => bullet.render(this.ctx))
    this.enemies.forEach((enemy) => enemy.render(this.ctx))
    this.powerUps.forEach((powerUp) => powerUp.render(this.ctx))
    this.particles.forEach((particle) => particle.render(this.ctx))

    // Draw UI
    this.drawUI()
  }

  drawUI() {
    this.ctx.fillStyle = "#ffffff"
    this.ctx.font = "20px Arial"
    this.ctx.fillText(`Score: ${this.score}`, 20, 30)
    this.ctx.fillText(`Level: ${this.level}`, 20, 60)

    if (!this.gameRunning) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = "#ffffff"
      this.ctx.font = "48px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.font = "24px Arial"
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50)
      this.ctx.fillText("Press R to Restart", this.canvas.width / 2, this.canvas.height / 2 + 100)
      this.ctx.textAlign = "left"
    }
  }

  gameOver() {
    this.gameRunning = false
    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyR" && !this.gameRunning) {
        this.restart()
      }
    })
  }

  restart() {
    this.player = new Player(this.canvas.width / 2, this.canvas.height - 60)
    this.bullets = []
    this.enemies = []
    this.particles = []
    this.powerUps = []
    this.score = 0
    this.level = 1
    this.gameRunning = true
    this.enemySpawnTimer = 0
    this.enemySpawnRate = 60
  }

  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }
}

class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    this.speed = 5
    this.shootCooldown = 0
    this.powerUpActive = false
    this.powerUpTimer = 0
  }

  moveLeft() {
    if (this.x > 0) {
      this.x -= this.speed
    }
  }

  moveRight(canvasWidth) {
    if (this.x < canvasWidth - this.width) {
      this.x += this.speed
    }
  }

  shoot() {
    if (this.shootCooldown <= 0) {
      this.shootCooldown = this.powerUpActive ? 5 : 15
      return new Bullet(this.x + this.width / 2 - 2, this.y, -8)
    }
    return null
  }

  activatePowerUp() {
    this.powerUpActive = true
    this.powerUpTimer = 300 // 5 seconds at 60fps
  }

  update() {
    if (this.shootCooldown > 0) {
      this.shootCooldown--
    }

    if (this.powerUpActive) {
      this.powerUpTimer--
      if (this.powerUpTimer <= 0) {
        this.powerUpActive = false
      }
    }
  }

  render(ctx) {
    // Draw player ship
    ctx.fillStyle = this.powerUpActive ? "#00ff00" : "#00aaff"
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // Draw ship details
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(this.x + 5, this.y + 5, 30, 10)
    ctx.fillRect(this.x + 15, this.y + 20, 10, 15)

    // Power-up indicator
    if (this.powerUpActive) {
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2
      ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4)
    }
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    this.speed = 2 + Math.random() * 2
  }

  update() {
    this.y += this.speed
  }

  render(ctx) {
    ctx.fillStyle = "#ff4444"
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // Draw enemy details
    ctx.fillStyle = "#aa0000"
    ctx.fillRect(this.x + 5, this.y + 5, 30, 30)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(this.x + 15, this.y + 15, 10, 10)
  }
}

class Bullet {
  constructor(x, y, speedY) {
    this.x = x
    this.y = y
    this.width = 4
    this.height = 10
    this.speedY = speedY
  }

  update() {
    this.y += this.speedY
  }

  render(ctx) {
    ctx.fillStyle = "#ffff00"
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // Add glow effect
    ctx.shadowColor = "#ffff00"
    ctx.shadowBlur = 10
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.shadowBlur = 0
  }
}

class PowerUp {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 20
    this.height = 20
    this.speed = 2
    this.rotation = 0
  }

  update() {
    this.y += this.speed
    this.rotation += 0.1
  }

  render(ctx) {
    ctx.save()
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
    ctx.rotate(this.rotation)

    ctx.fillStyle = "#00ff00"
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(-5, -2, 10, 4)
    ctx.fillRect(-2, -5, 4, 10)

    ctx.restore()
  }
}

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 10
    this.vy = (Math.random() - 0.5) * 10
    this.life = 30
    this.maxLife = 30
    this.size = Math.random() * 4 + 2
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vx *= 0.98
    this.vy *= 0.98
    this.life--
  }

  render(ctx) {
    const alpha = this.life / this.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = `hsl(${Math.random() * 60 + 15}, 100%, 50%)`
    ctx.fillRect(this.x, this.y, this.size, this.size)
    ctx.globalAlpha = 1
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  new Game()
})
