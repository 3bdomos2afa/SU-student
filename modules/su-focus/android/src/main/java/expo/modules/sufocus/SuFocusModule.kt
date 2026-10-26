package expo.modules.sufocus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Ongoing focus-timer notification with a live countdown (Android chronometer).
// It removes itself when the time is up, even if the app is closed.
class SuFocusModule : Module() {
  private val channelId = "su-focus-live"
  private val notificationId = 47011

  override fun definition() = ModuleDefinition {
    Name("SuFocus")

    Function("show") { endAt: Double, title: String, body: String ->
      show(endAt.toLong(), title, body)
    }

    Function("hide") {
      hide()
    }
  }

  private fun context(): Context? = appContext.reactContext?.applicationContext

  private fun manager(ctx: Context): NotificationManager =
    ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun hide(): Boolean {
    val ctx = context() ?: return false
    manager(ctx).cancel(notificationId)
    return true
  }

  private fun show(endAt: Long, title: String, body: String): Boolean {
    val ctx = context() ?: return false
    val nm = manager(ctx)
    val left = endAt - System.currentTimeMillis()
    if (left <= 1000L) {
      nm.cancel(notificationId)
      return false
    }
    val builder: Notification.Builder
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "تايمر التركيز", NotificationManager.IMPORTANCE_LOW)
      channel.setSound(null, null)
      channel.enableVibration(false)
      channel.setShowBadge(false)
      nm.createNotificationChannel(channel)
      builder = Notification.Builder(ctx, channelId)
      builder.setTimeoutAfter(left)
    } else {
      builder = Notification.Builder(ctx)
    }
    builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
    builder.setContentTitle(title)
    builder.setContentText(body)
    builder.setOngoing(true)
    builder.setOnlyAlertOnce(true)
    builder.setShowWhen(true)
    builder.setWhen(endAt)
    builder.setUsesChronometer(true)
    builder.setColor(0xFF7C3AED.toInt())
    builder.setCategory(Notification.CATEGORY_PROGRESS)
    builder.setVisibility(Notification.VISIBILITY_PRIVATE)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      builder.setChronometerCountDown(true)
    }
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
    if (launch != null) {
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      builder.setContentIntent(PendingIntent.getActivity(ctx, 47011, launch, flags))
    }
    return try {
      nm.notify(notificationId, builder.build())
      true
    } catch (e: Exception) {
      false
    }
  }
}