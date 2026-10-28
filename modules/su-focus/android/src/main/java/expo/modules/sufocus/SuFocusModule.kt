package expo.modules.sufocus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
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

    // Background health: is the app exempt from battery optimisation / background restriction?
    Function("batteryStatus") { batteryStatus() }
    // Official Android dialog "Allow app to always run in background?"
    Function("requestUnrestricted") { requestUnrestricted() }
    // Manufacturer auto-start / never-sleep page (Xiaomi, Oppo/Realme, Vivo, Huawei/Honor, Samsung).
    Function("openAutostart") { openAutostart() }
    Function("openAppSettings") { start(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + (context()?.packageName ?: ""))) ) }
  }

  private fun context(): Context? = appContext.reactContext?.applicationContext

  private fun manager(ctx: Context): NotificationManager =
    ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun batteryStatus(): Map<String, Any> {
    val ctx = context() ?: return mapOf("ignoring" to true, "restricted" to false, "brand" to "", "sdk" to Build.VERSION.SDK_INT)
    val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
    val ignoring = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || pm.isIgnoringBatteryOptimizations(ctx.packageName)
    var restricted = false
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      restricted = am.isBackgroundRestricted
    }
    return mapOf("ignoring" to ignoring, "restricted" to restricted,
      "brand" to (Build.MANUFACTURER ?: "").lowercase(), "sdk" to Build.VERSION.SDK_INT)
  }

  private fun start(intent: Intent): Boolean {
    val activity = appContext.currentActivity
    return try {
      if (activity != null) activity.startActivity(intent)
      else { intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); context()?.startActivity(intent) ?: return false }
      true
    } catch (e: Exception) { false }
  }

  private fun requestUnrestricted(): Boolean {
    val pkg = context()?.packageName ?: return false
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false
    return start(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$pkg")))
      || start(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
      || start(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$pkg")))
  }

  private fun openAutostart(): Boolean {
    val pages = listOf(
      "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
      "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
      "com.coloros.safecenter" to "com.coloros.safecenter.startupapp.StartupAppListActivity",
      "com.oplus.safecenter" to "com.oplus.safecenter.permission.startup.StartupAppListActivity",
      "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
      "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
      "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager",
      "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
      "com.huawei.systemmanager" to "com.huawei.systemmanager.optimize.process.ProtectActivity",
      "com.hihonor.systemmanager" to "com.hihonor.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
      "com.samsung.android.lool" to "com.samsung.android.sm.battery.ui.BatteryActivity",
      "com.samsung.android.lool" to "com.samsung.android.sm.ui.battery.BatteryActivity"
    )
    for ((pkg, cls) in pages) {
      if (start(Intent().setComponent(ComponentName(pkg, cls)))) return true
    }
    val own = context()?.packageName ?: return false
    return start(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$own")))
  }

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